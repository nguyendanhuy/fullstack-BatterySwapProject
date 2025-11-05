package BatterySwapStation.service;

import BatterySwapStation.dto.TicketResolveRequest;
import BatterySwapStation.dto.TicketResponse;
import BatterySwapStation.dto.TicketUpdateRequest;
import BatterySwapStation.entity.*;
import BatterySwapStation.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService { // ✅ Đổi tên lớp

    // ✅ Giữ lại các Repository cần thiết cho Ticket
    private final BookingRepository bookingRepository;
    private final DisputeTicketRepository disputeTicketRepository;
    private final UserRepository userRepository;
    private final StationRepository stationRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService; // xử lý VNPAY redirect nếu cần
    private final UserService userService;
    private final SystemPriceService systemPriceService;


    // ----------------------------------------------------------------------
    // --- 1. TẠO DISPUTE TICKET (POST /tickets) ---
    // ----------------------------------------------------------------------
    @Transactional
    public DisputeTicket createDisputeTicket(Long bookingId,
                                             String staffId,
                                             String title,
                                             String description,
                                             String disputeReason,
                                             Integer stationId
    ) {
        // ... (Logic tạo Dispute Ticket giữ nguyên) ...

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Booking ID: " + bookingId));

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Staff (User) ID: " + staffId));

        Station station = stationRepository.findById(stationId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Station ID: " + stationId));

        DisputeTicket.DisputeReason reasonEnum;
        try {
            reasonEnum = DisputeTicket.DisputeReason.valueOf(disputeReason.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Lý do tranh chấp không hợp lệ: " + disputeReason + ". Phải là BAD_CONDITION, SOH, hoặc OTHER.");
        }

        DisputeTicket ticket = DisputeTicket.builder()
                .booking(booking)
                .user(booking.getUser())
                .createdByStaff(staff)
                .station(station)
                .status(DisputeTicket.TicketStatus.IN_PROGRESS)
                .title(title)
                .description(description)
                .reason(reasonEnum)
                .createdAt(LocalDateTime.now())
                .build();

        DisputeTicket savedTicket = disputeTicketRepository.save(ticket);
        log.info("Đã tạo Dispute Ticket #{} liên kết với Booking #{}", savedTicket.getId(), bookingId);

        return savedTicket;
    }

    // -------------------------------------------------------------------
    // --- 2. LẤY TICKET THEO STAFF ĐÃ TẠO (GET /tickets/staff/{id}) ---
    // -------------------------------------------------------------------
    public List<TicketResponse> getDisputesByStaffId(String staffUserId) {
        List<DisputeTicket> tickets = disputeTicketRepository.findByCreatedByStaff_UserId(staffUserId);

        return tickets.stream()
                .map(this::convertToTicketResponse)
                .toList();
    }

    // -------------------------------------------------------------------
    // --- 3. CẬP NHẬT TICKET (PUT /tickets/{id}) ---
    // -------------------------------------------------------------------
    @Transactional
    public TicketResponse updateTicket(Long ticketId, TicketUpdateRequest request) {
        DisputeTicket ticket = disputeTicketRepository.findById(ticketId)
                .orElseThrow(() -> new EntityNotFoundException("Ticket không tồn tại với ID: " + ticketId));

        if (request.getNewDescription() != null) {
            ticket.setDescription(request.getNewDescription());
        }

        if (request.getNewStatus() != null) {
            try {
                DisputeTicket.TicketStatus newStatus = DisputeTicket.TicketStatus.valueOf(request.getNewStatus().toUpperCase());
                // Nếu chuyển sang RESOLVED, đặt resolvedAt; nếu chuyển đi khỏi RESOLVED, xóa resolvedAt
                if (newStatus == DisputeTicket.TicketStatus.RESOLVED) {
                    ticket.setResolvedAt(LocalDateTime.now());
                } else {
                    ticket.setResolvedAt(null);
                }
                ticket.setStatus(newStatus);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Trạng thái ticket không hợp lệ: " + request.getNewStatus());
            }
        }

        if (request.getNewReason() != null) {
            try {
                ticket.setReason(DisputeTicket.DisputeReason.valueOf(request.getNewReason().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Lý do ticket không hợp lệ: " + request.getNewReason());
            }
        }

        DisputeTicket updatedTicket = disputeTicketRepository.save(ticket);
        return convertToTicketResponse(updatedTicket);
    }

    /**
     * Đánh dấu ticket là RESOLVED, thiết lập resolvedAt và lưu thông tin cách giải quyết.
     * - resolutionMethod: Enum để user chọn cách giải quyết
     * - resolutionDescription: Chỉ bắt buộc nhập khi ticket.reason == OTHER
     */
    @Transactional
    public TicketResponse resolveTicket(Long ticketId, TicketResolveRequest req) {

        DisputeTicket ticket = disputeTicketRepository.findById(ticketId)
                .orElseThrow(() -> new EntityNotFoundException("Ticket không tồn tại: " + ticketId));

        if (req.getResolutionMethod() == null) {
            throw new IllegalArgumentException("Phải chọn phương thức xử lý.");
        }

        // ===== VALIDATION =====
        switch (req.getResolutionMethod()) {

            case PENALTY -> {
                if (req.getPenaltyLevel() == null || req.getPenaltyLevel() == DisputeTicket.PenaltyLevel.NONE) {
                    throw new IllegalArgumentException("Phải chọn mức phạt khi xử lý bằng PENALTY.");
                }
                if (req.getPaymentChannel() == null || req.getPaymentChannel() == Payment.PaymentChannel.NONE) {
                    throw new IllegalArgumentException("Phải chọn phương thức thanh toán cho mức phạt.");
                }
            }

            case REFUND -> {
                if (req.getPenaltyLevel() != null && req.getPenaltyLevel() != DisputeTicket.PenaltyLevel.NONE) {
                    throw new IllegalArgumentException("Không được chọn mức phạt khi REFUND.");
                }
                if (req.getPaymentChannel() != null && req.getPaymentChannel() != Payment.PaymentChannel.NONE) {
                    throw new IllegalArgumentException("Không được chọn phương thức thanh toán khi REFUND.");
                }
            }

            case NO_ACTION -> {
                if (req.getPenaltyLevel() != null || req.getPaymentChannel() != null) {
                    throw new IllegalArgumentException("NO_ACTION không cần mức phạt hoặc phương thức thanh toán.");
                }
            }

            case OTHER -> {
                if (req.getResolutionDescription() == null || req.getResolutionDescription().isBlank()) {
                    throw new IllegalArgumentException("Phải nhập mô tả khi chọn OTHER.");
                }
            }
        }

        User user = ticket.getUser();

        // ✅ CASE: PENALTY
        if (req.getResolutionMethod() == DisputeTicket.ResolutionMethod.PENALTY) {

            SystemPrice.PriceType priceType = mapPenaltyToPriceType(req.getPenaltyLevel());
            Double penaltyAmount = systemPriceService.getPriceByType(priceType);

            // ✅ Tạo invoice
            Invoice invoice = new Invoice();
            invoice.setUserId(user.getUserId());
            invoice.setCreatedDate(LocalDateTime.now());
            invoice.setInvoiceType(Invoice.InvoiceType.PENALTY);
            invoice.setInvoiceStatus(Invoice.InvoiceStatus.PENDING);
            invoice.setTotalAmount(penaltyAmount);
            invoiceRepository.save(invoice);

            // ✅ Gắn invoice vào ticket
            ticket.setPenaltyInvoice(invoice);

            Payment payment = Payment.builder()
                    .invoice(invoice)
                    .amount(penaltyAmount)
                    .paymentMethod(req.getPaymentChannel() == Payment.PaymentChannel.WALLET ?
                            Payment.PaymentMethod.WALLET :
                            req.getPaymentChannel() == Payment.PaymentChannel.CASH ?
                                    Payment.PaymentMethod.CASH :
                                    Payment.PaymentMethod.VNPAY)
                    .paymentChannel(req.getPaymentChannel())
                    .transactionType(Payment.TransactionType.PAYMENT)
                    .paymentStatus(Payment.PaymentStatus.PENDING)
                    .createdAt(LocalDateTime.now())
                    .message("Penalty ticket #" + ticketId)
                    .build();

            paymentRepository.save(payment);

            switch (req.getPaymentChannel()) {

                case CASH -> {
                    // Staff sẽ confirm sau
                    ticket.setStatus(DisputeTicket.TicketStatus.IN_PROGRESS);
                    ticket.setResolutionMethod(DisputeTicket.ResolutionMethod.PENALTY.name());
                    ticket.setResolutionDescription(
                            (req.getResolutionDescription() == null ? "" : req.getResolutionDescription())
                                    + " | Thanh toán tiền mặt chờ xác nhận"
                    );
                }

                case WALLET -> {
                    if (user.getWalletBalance() < penaltyAmount)
                        throw new IllegalStateException("Ví không đủ tiền");

                    user.setWalletBalance(user.getWalletBalance() - penaltyAmount);
                    userRepository.save(user);

                    payment.setPaymentStatus(Payment.PaymentStatus.SUCCESS);
                    paymentRepository.save(payment);

                    invoice.setInvoiceStatus(Invoice.InvoiceStatus.PAID);
                    invoiceRepository.save(invoice);

                    ticket.setStatus(DisputeTicket.TicketStatus.RESOLVED);
                    ticket.setResolvedAt(LocalDateTime.now());
                    ticket.setResolutionMethod(DisputeTicket.ResolutionMethod.PENALTY.name());
                    ticket.setPenaltyLevel(req.getPenaltyLevel());
                    ticket.setResolutionDescription("Thanh toán ví thành công");
                    disputeTicketRepository.save(ticket);

                    TicketResponse res = convertToTicketResponse(ticket);
                    res.setInvoiceId(invoice.getInvoiceId());
                    return res;
                }


                case VNPAY -> {
                    // FE lấy invoiceId để redirect
                    TicketResponse res = convertToTicketResponse(ticket);
                    res.setInvoiceId(invoice.getInvoiceId());
                    disputeTicketRepository.save(ticket);
                    return res;
                }
            }

            disputeTicketRepository.save(ticket);
            return convertToTicketResponse(ticket);
        }

        // ✅ CASE: REFUND
        if (req.getResolutionMethod() == DisputeTicket.ResolutionMethod.REFUND) {
            double refund = ticket.getBooking().getAmount();
            user.setWalletBalance(user.getWalletBalance() + refund);
            userRepository.save(user);
            ticket.setStatus(DisputeTicket.TicketStatus.RESOLVED);
            ticket.setResolvedAt(LocalDateTime.now());
        }

        // ✅ CASE: NO_ACTION / OTHER
        ticket.setResolutionMethod(req.getResolutionMethod().name());
        ticket.setResolutionDescription(req.getResolutionDescription());
        ticket.setStatus(DisputeTicket.TicketStatus.RESOLVED);
        ticket.setResolvedAt(LocalDateTime.now());

        disputeTicketRepository.save(ticket);
        return convertToTicketResponse(ticket);
    }



    private SystemPrice.PriceType mapPenaltyToPriceType(DisputeTicket.PenaltyLevel level) {
        return switch (level) {
            case MINOR -> SystemPrice.PriceType.PENALTY_MINOR;
            case MEDIUM -> SystemPrice.PriceType.PENALTY_MEDIUM;
            case SEVERE -> SystemPrice.PriceType.PENALTY_SEVERE;
            default -> throw new IllegalArgumentException("Không có mức phạt tương ứng trong SystemPrice");
        };
    }


    // -------------------------------------------------------------------
    // --- 4. LẤY TICKET ĐANG MỞ (GET /tickets/open) ---
    // -------------------------------------------------------------------
    public List<TicketResponse> getOpenDisputes() {
        // "Open" hiện tương ứng với các ticket đang xử lý (IN_PROGRESS)
        List<DisputeTicket> tickets = disputeTicketRepository.findByStatus(DisputeTicket.TicketStatus.IN_PROGRESS);
        return tickets.stream()
                .map(this::convertToTicketResponse)
                .toList();
    }

    // -------------------------------------------------------------------
    // --- 5. LẤY TICKET THEO TRẠM (GET /tickets/by-station) ---
    // -------------------------------------------------------------------
    public List<TicketResponse> getDisputesByStation(Integer stationId) {
        List<DisputeTicket> tickets = disputeTicketRepository.findByStation_StationIdOrderByCreatedAtDesc(stationId);
        return tickets.stream()
                .map(this::convertToTicketResponse)
                .toList();
    }

    // ---------------------------------
    // --- HÀM HELPER (CHUYỂN ĐỔI DTO) ---
    // ---------------------------------
    private TicketResponse convertToTicketResponse(DisputeTicket ticket) {
        TicketResponse res = new TicketResponse();
        res.setId(ticket.getId());
        res.setBookingId(ticket.getBooking() != null ? ticket.getBooking().getBookingId() : null);
        res.setTitle(ticket.getTitle());
        res.setDescription(ticket.getDescription());
        res.setStatus(ticket.getStatus().name());
        res.setResolvedAt(ticket.getResolvedAt());
        res.setResolutionMethod(ticket.getResolutionMethod());
        res.setResolutionDescription(ticket.getResolutionDescription());
        res.setCreatedAt(ticket.getCreatedAt());

        if (ticket.getReason() != null) {
            res.setReason(ticket.getReason().name());
        }

        if (ticket.getCreatedByStaff() != null) {
            res.setCreatedByStaffName(ticket.getCreatedByStaff().getFullName());
        }

        // ✅ Invoice ID
        if (ticket.getPenaltyInvoice() != null) {
            res.setInvoiceId(ticket.getPenaltyInvoice().getInvoiceId());
        }

        // ✅ Penalty Level
        if (ticket.getPenaltyLevel() != null) {
            res.setPenaltyLevel(ticket.getPenaltyLevel().name());
        }

        // ✅ Payment Channel (fetch latest payment of invoice)
        if (ticket.getPenaltyInvoice() != null) {
            paymentRepository.findTopByInvoiceOrderByCreatedAtDesc(ticket.getPenaltyInvoice())
                    .ifPresent(p -> res.setPaymentChannel(
                            p.getPaymentChannel() != null ? p.getPaymentChannel().name() : null
                    ));
        }

        return res;
    }


    @Transactional
    public TicketResponse confirmCashReceived(Long ticketId, String staffId) {

        DisputeTicket ticket = disputeTicketRepository.findById(ticketId)
                .orElseThrow(() -> new EntityNotFoundException("Ticket không tồn tại"));

        Invoice invoice = ticket.getPenaltyInvoice();
        if (invoice == null) throw new EntityNotFoundException("Ticket không gắn invoice phạt");

        if (invoice.getInvoiceStatus() == Invoice.InvoiceStatus.PAID)
            throw new IllegalStateException("Hóa đơn đã được thanh toán rồi");

        Payment payment = paymentRepository
                .findTopByInvoiceAndPaymentMethodAndPaymentStatus(
                        invoice, Payment.PaymentMethod.CASH, Payment.PaymentStatus.PENDING
                )
                .orElseThrow(() -> new IllegalStateException("Không có giao dịch CASH đang chờ xác nhận"));

        payment.setPaymentStatus(Payment.PaymentStatus.SUCCESS);
        payment.setMessage("Cash received by staff " + staffId);
        paymentRepository.save(payment);

        invoice.setInvoiceStatus(Invoice.InvoiceStatus.PAID);
        invoiceRepository.save(invoice);

        ticket.setStatus(DisputeTicket.TicketStatus.RESOLVED);
        ticket.setResolvedAt(LocalDateTime.now());
        ticket.setResolutionDescription("Thanh toán tiền mặt thành công bởi staff " + staffId);
        disputeTicketRepository.save(ticket);

        return convertToTicketResponse(ticket);
    }


}