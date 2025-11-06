package BatterySwapStation.service;

import BatterySwapStation.dto.TicketResolveRequest;
import BatterySwapStation.dto.TicketResponse;
import BatterySwapStation.dto.TicketUpdateRequest;
import BatterySwapStation.entity.Payment.PaymentChannel;
import BatterySwapStation.entity.*;
import BatterySwapStation.repository.*;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private final BookingRepository bookingRepository;
    private final DisputeTicketRepository disputeTicketRepository;
    private final UserRepository userRepository;
    private final StationRepository stationRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final UserService userService;
    private final SystemPriceService systemPriceService;

    // ----------------------------------------------------------------------
    // --- 1. TẠO DISPUTE TICKET ---
    // ----------------------------------------------------------------------
    @Transactional
    public DisputeTicket createDisputeTicket(Long bookingId, String staffId,
                                             String title, String description,
                                             String disputeReason, Integer stationId) {

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Booking ID: " + bookingId));

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Staff ID: " + staffId));

        Station station = stationRepository.findById(stationId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Station ID: " + stationId));

        DisputeTicket.DisputeReason reasonEnum;
        try {
            reasonEnum = DisputeTicket.DisputeReason.valueOf(disputeReason.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Lý do tranh chấp không hợp lệ: " + disputeReason);
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

        DisputeTicket saved = disputeTicketRepository.save(ticket);
        log.info("✅ Đã tạo Dispute Ticket #{} cho Booking #{}", saved.getId(), bookingId);
        return saved;
    }

    // -------------------------------------------------------------------
    // --- 2. GET THEO STAFF ---
    // -------------------------------------------------------------------
    public List<TicketResponse> getDisputesByStaffId(String staffUserId) {
        return disputeTicketRepository.findByCreatedByStaff_UserId(staffUserId)
                .stream().map(this::convertToTicketResponse).toList();
    }

    // -------------------------------------------------------------------
    // --- 3. UPDATE TICKET ---
    // -------------------------------------------------------------------
    @Transactional
    public TicketResponse updateTicket(Long ticketId, TicketUpdateRequest request) {
        DisputeTicket ticket = disputeTicketRepository.findById(ticketId)
                .orElseThrow(() -> new EntityNotFoundException("Ticket không tồn tại: " + ticketId));

        if (request.getNewDescription() != null)
            ticket.setDescription(request.getNewDescription());

        if (request.getNewStatus() != null) {
            DisputeTicket.TicketStatus newStatus = DisputeTicket.TicketStatus.valueOf(request.getNewStatus().toUpperCase());
            if (newStatus == DisputeTicket.TicketStatus.RESOLVED) {
                ticket.setResolvedAt(LocalDateTime.now());
            } else {
                ticket.setResolvedAt(null);
            }
            ticket.setStatus(newStatus);
        }

        if (request.getNewReason() != null) {
            ticket.setReason(DisputeTicket.DisputeReason.valueOf(request.getNewReason().toUpperCase()));
        }

        return convertToTicketResponse(disputeTicketRepository.save(ticket));
    }

    // -------------------------------------------------------------------
    // --- 4. GET OPEN / BY STATION ---
    // -------------------------------------------------------------------
    public List<TicketResponse> getOpenDisputes() {
        return disputeTicketRepository.findByStatus(DisputeTicket.TicketStatus.IN_PROGRESS)
                .stream().map(this::convertToTicketResponse).toList();
    }

    public List<TicketResponse> getDisputesByStation(Integer stationId) {
        return disputeTicketRepository.findByStation_StationIdOrderByCreatedAtDesc(stationId)
                .stream().map(this::convertToTicketResponse).toList();
    }

    // -------------------------------------------------------------------
    // --- 5. CONVERT DTO ---
    // -------------------------------------------------------------------
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

        if (ticket.getReason() != null)
            res.setReason(ticket.getReason().name());

        if (ticket.getCreatedByStaff() != null)
            res.setCreatedByStaffName(ticket.getCreatedByStaff().getFullName());

        if (ticket.getPenaltyInvoice() != null)
            res.setInvoiceId(ticket.getPenaltyInvoice().getInvoiceId());

        if (ticket.getPenaltyLevel() != null)
            res.setPenaltyLevel(ticket.getPenaltyLevel().name());

        // ✅ Ưu tiên payment thực tế, fallback sang ticket.paymentChannel
        if (ticket.getPenaltyInvoice() != null) {
            paymentRepository.findTopByInvoiceOrderByCreatedAtDesc(ticket.getPenaltyInvoice())
                    .ifPresentOrElse(
                            p -> res.setPaymentChannel(
                                    p.getPaymentChannel() != null ? p.getPaymentChannel().name() : null
                            ),
                            () -> res.setPaymentChannel(
                                    ticket.getPaymentChannel() != null ? ticket.getPaymentChannel().name() : null
                            )
                    );
        } else if (ticket.getPaymentChannel() != null) {
            res.setPaymentChannel(ticket.getPaymentChannel().name());
        }

        return res;
    }

    // -------------------------------------------------------------------
    // --- 6. CONFIRM CASH ---
    // -------------------------------------------------------------------
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
                        invoice, Payment.PaymentMethod.CASH, Payment.PaymentStatus.PENDING)
                .orElseThrow(() -> new IllegalStateException("Không có giao dịch CASH đang chờ xác nhận"));

        payment.setPaymentStatus(Payment.PaymentStatus.SUCCESS);
        payment.setMessage("Cash received by staff " + staffId);
        paymentRepository.save(payment);

        invoice.setInvoiceStatus(Invoice.InvoiceStatus.PAID);
        invoiceRepository.save(invoice);

        ticket.setStatus(DisputeTicket.TicketStatus.RESOLVED);
        ticket.setResolvedAt(LocalDateTime.now());
        ticket.setResolutionDescription("Thanh toán tiền mặt thành công bởi staff " + staffId);
        ticket.setPaymentChannel(PaymentChannel.CASH);
        disputeTicketRepository.save(ticket);

        log.info("📢 [TICKET:{}] Staff {} xác nhận tiền mặt → Ticket RESOLVED", ticket.getId(), staffId);
        return convertToTicketResponse(ticket);
    }

    // -------------------------------------------------------------------
    // --- 7. RESOLVE TICKET ---
    // -------------------------------------------------------------------
    @Transactional
    public TicketResponse resolveTicket(Long ticketId, TicketResolveRequest req, HttpServletRequest http) {
        DisputeTicket ticket = disputeTicketRepository.findById(ticketId)
                .orElseThrow(() -> new EntityNotFoundException("Ticket không tồn tại: " + ticketId));

        User user = ticket.getUser();
        validateResolveRequest(req);

        return switch (req.getResolutionMethod()) {
            case PENALTY -> handlePenaltyResolution(ticket, user, req, http);
            case REFUND -> handleRefundResolution(ticket, user);
            case OTHER -> handleOtherResolution(ticket, req);
            case NO_ACTION -> handleOtherResolution(ticket, req); // ✅ thêm dòng này
        };
    }

    private void validateResolveRequest(TicketResolveRequest req) {
        switch (req.getResolutionMethod()) {
            case PENALTY -> {
                if (req.getPenaltyLevel() == null || req.getPenaltyLevel() == DisputeTicket.PenaltyLevel.NONE)
                    throw new IllegalArgumentException("Phải chọn mức phạt khi xử lý bằng PENALTY.");
                if (req.getPaymentChannel() == null || req.getPaymentChannel() == PaymentChannel.NONE)
                    throw new IllegalArgumentException("Phải chọn phương thức thanh toán cho mức phạt.");
            }
            case REFUND -> {
                if (req.getPenaltyLevel() != null && req.getPenaltyLevel() != DisputeTicket.PenaltyLevel.NONE)
                    throw new IllegalArgumentException("Không được chọn mức phạt khi REFUND.");
            }
            case OTHER -> {
                if (req.getResolutionDescription() == null || req.getResolutionDescription().isBlank())
                    throw new IllegalArgumentException("Phải nhập mô tả khi chọn OTHER.");
            }
        }
    }

    // -------------------------------------------------------------------
    // --- 8. HANDLE PENALTY ---
    // -------------------------------------------------------------------
    private TicketResponse handlePenaltyResolution(DisputeTicket ticket, User user,
                                                   TicketResolveRequest req, HttpServletRequest http) {
        SystemPrice.PriceType priceType = switch (req.getPenaltyLevel()) {
            case MINOR -> SystemPrice.PriceType.PENALTY_MINOR;
            case MEDIUM -> SystemPrice.PriceType.PENALTY_MEDIUM;
            case SEVERE -> SystemPrice.PriceType.PENALTY_SEVERE;
            default -> throw new IllegalArgumentException("Không có mức phạt hợp lệ");
        };

        Double penaltyAmount = systemPriceService.getPriceByType(priceType);
        Invoice invoice = createPenaltyInvoice(user, penaltyAmount);
        ticket.setPenaltyInvoice(invoice);
        ticket.setPenaltyLevel(req.getPenaltyLevel());

        return switch (req.getPaymentChannel()) {
            case CASH -> handleCashPenalty(ticket, req, invoice, penaltyAmount);
            case WALLET -> handleWalletPenalty(ticket, user, invoice, penaltyAmount, req);
            case VNPAY -> handleVnPayPenalty(ticket, req, invoice, penaltyAmount);
            default -> throw new IllegalArgumentException("Phương thức thanh toán không hợp lệ");
        };
    }

    private TicketResponse handleCashPenalty(DisputeTicket ticket, TicketResolveRequest req,
                                             Invoice invoice, Double amount) {
        log.info("💵 [TICKET:{}] Penalty CASH | Level={} | Amount={}",
                ticket.getId(), req.getPenaltyLevel(), amount);

        createPayment(invoice, amount, Payment.PaymentMethod.CASH, PaymentChannel.CASH, ticket.getId());

        ticket.setStatus(DisputeTicket.TicketStatus.IN_PROGRESS);
        ticket.setResolutionMethod(DisputeTicket.ResolutionMethod.PENALTY.name());
        ticket.setResolutionDescription((req.getResolutionDescription() == null ? "" : req.getResolutionDescription())
                + " | Thanh toán tiền mặt chờ xác nhận");
        ticket.setPaymentChannel(PaymentChannel.CASH);
        disputeTicketRepository.save(ticket);

        return convertToTicketResponse(ticket);
    }

    private TicketResponse handleWalletPenalty(DisputeTicket ticket, User user,
                                               Invoice invoice, Double amount, TicketResolveRequest req) {
        if (user.getWalletBalance() < amount)
            throw new IllegalStateException("Ví không đủ tiền để thanh toán phạt");

        user.setWalletBalance(user.getWalletBalance() - amount);
        userRepository.save(user);

        log.info("💰 [TICKET:{}] Penalty WALLET | Level={} | Amount={}",
                ticket.getId(), req.getPenaltyLevel(), amount);

        Payment payment = createPayment(invoice, amount,
                Payment.PaymentMethod.WALLET, PaymentChannel.WALLET, ticket.getId());
        payment.setPaymentStatus(Payment.PaymentStatus.SUCCESS);
        paymentRepository.save(payment);

        invoice.setInvoiceStatus(Invoice.InvoiceStatus.PAID);
        invoiceRepository.save(invoice);

        ticket.setStatus(DisputeTicket.TicketStatus.RESOLVED);
        ticket.setResolvedAt(LocalDateTime.now());
        ticket.setResolutionMethod(DisputeTicket.ResolutionMethod.PENALTY.name());
        ticket.setResolutionDescription("Thanh toán ví thành công");
        ticket.setPaymentChannel(PaymentChannel.WALLET);
        disputeTicketRepository.save(ticket);

        TicketResponse res = convertToTicketResponse(ticket);
        res.setInvoiceId(invoice.getInvoiceId());
        res.setPaymentChannel("WALLET");
        return res;
    }

    private TicketResponse handleVnPayPenalty(DisputeTicket ticket, TicketResolveRequest req,
                                              Invoice invoice, Double amount) {
        log.info("💳 [TICKET:{}] Penalty VNPAY | Level={} | Amount={}",
                ticket.getId(), req.getPenaltyLevel(), amount);

        ticket.setStatus(DisputeTicket.TicketStatus.IN_PROGRESS);
        ticket.setPenaltyLevel(req.getPenaltyLevel());
        ticket.setResolutionMethod(DisputeTicket.ResolutionMethod.PENALTY.name());
        ticket.setResolutionDescription("Chờ admin tạo link VNPay để thanh toán");
        ticket.setPaymentChannel(PaymentChannel.VNPAY);
        disputeTicketRepository.save(ticket);

        TicketResponse res = convertToTicketResponse(ticket);
        res.setInvoiceId(invoice.getInvoiceId());
        res.setPaymentChannel("VNPAY");
        return res;
    }

    // -------------------------------------------------------------------
    // --- 9. CREATE INVOICE / PAYMENT ---
    // -------------------------------------------------------------------
    private Invoice createPenaltyInvoice(User user, Double amount) {
        Invoice invoice = new Invoice();
        invoice.setUserId(user.getUserId());
        invoice.setCreatedDate(LocalDateTime.now());
        invoice.setInvoiceType(Invoice.InvoiceType.PENALTY);
        invoice.setInvoiceStatus(Invoice.InvoiceStatus.PENDING);
        invoice.setTotalAmount(amount);
        return invoiceRepository.save(invoice);
    }

    private Payment createPayment(Invoice invoice,
                                  Double amount,
                                  Payment.PaymentMethod method,
                                  PaymentChannel channel,
                                  Long ticketId) {

        // 🔍 Lấy ticket tương ứng (nếu có) để gắn penalty info
        DisputeTicket linkedTicket = disputeTicketRepository
                .findByPenaltyInvoice_InvoiceId(invoice.getInvoiceId())
                .orElse(null);

        DisputeTicket.PenaltyLevel penaltyLevel = linkedTicket != null
                ? linkedTicket.getPenaltyLevel()
                : null;

        Payment p = Payment.builder()
                .invoice(invoice)
                .amount(amount)
                .paymentMethod(method)
                .paymentChannel(channel)
                .transactionType(Payment.TransactionType.PAYMENT)
                .paymentStatus(Payment.PaymentStatus.PENDING)
                .penaltyLevel(penaltyLevel)
                .penaltyAmount(amount)
                .createdAt(LocalDateTime.now())
                .message("Penalty ticket #" + ticketId)
                .build();

        Payment saved = paymentRepository.save(p);

        log.info("💾 [SYNC PAYMENT] invoice={} | channel={} | penaltyLevel={} | penaltyAmount={}",
                invoice.getInvoiceId(), channel, penaltyLevel, amount);

        return saved;
    }


    // -------------------------------------------------------------------
    // --- 10. HANDLE REFUND / OTHER ---
    // -------------------------------------------------------------------
    private TicketResponse handleRefundResolution(DisputeTicket ticket, User user) {
        double refund = ticket.getBooking().getAmount();
        user.setWalletBalance(user.getWalletBalance() + refund);
        userRepository.save(user);

        ticket.setStatus(DisputeTicket.TicketStatus.RESOLVED);
        ticket.setResolvedAt(LocalDateTime.now());
        disputeTicketRepository.save(ticket);
        return convertToTicketResponse(ticket);
    }

    private TicketResponse handleOtherResolution(DisputeTicket ticket, TicketResolveRequest req) {
        ticket.setResolutionMethod(req.getResolutionMethod().name());
        ticket.setResolutionDescription(req.getResolutionDescription());
        ticket.setStatus(DisputeTicket.TicketStatus.RESOLVED);
        ticket.setResolvedAt(LocalDateTime.now());
        disputeTicketRepository.save(ticket);
        return convertToTicketResponse(ticket);
    }
}
