package BatterySwapStation.service;

import BatterySwapStation.entity.Invoice;
import BatterySwapStation.entity.Booking;
import BatterySwapStation.dto.InvoiceResponseDTO;
import BatterySwapStation.dto.BookingInfoDTO;
import BatterySwapStation.dto.InvoiceSimpleResponseDTO;
import BatterySwapStation.entity.Payment;
import BatterySwapStation.entity.SystemPrice;
import BatterySwapStation.entity.SubscriptionPlan;
import BatterySwapStation.repository.InvoiceRepository;
import BatterySwapStation.repository.BookingRepository;
import BatterySwapStation.repository.PaymentRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class InvoiceService {
    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private SystemPriceService systemPriceService;

    @Autowired
    private PaymentRepository paymentRepository;

    /**
     * Lấy chi tiết invoice bao gồm thông tin các booking
     * ✅ [CẬP NHẬT] Thêm @Transactional và 2 trường mới
     */
    @Transactional(readOnly = true) // <-- THÊM MỚI (Rất quan trọng để fix lỗi Lazy loading)
    public InvoiceResponseDTO getInvoiceDetail(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn với ID: " + invoiceId));

        InvoiceResponseDTO dto = new InvoiceResponseDTO();
        dto.setId(invoice.getInvoiceId());
        dto.setCreatedDate(invoice.getCreatedDate());
        dto.setTotalAmount(invoice.getTotalAmount());
        dto.setPricePerSwap(invoice.getPricePerSwap());
        dto.setNumberOfSwaps(invoice.getNumberOfSwaps());

        // ✅ [LOGIC MỚI 1] - Thêm InvoiceType
        if (invoice.getInvoiceType() != null) {
            dto.setInvoiceType(invoice.getInvoiceType().name());
        } else {
            dto.setInvoiceType(Invoice.InvoiceType.BOOKING.name()); // Mặc định
        }

        // ✅ [LOGIC MỚI 2] - Thêm PaymentMethod
        String pm = null;
        if (invoice.getTotalAmount() != null && invoice.getTotalAmount() == 0) {
            pm = "SUBSCRIPTION"; // Gói cước
        } else if (invoice.getPayments() != null && !invoice.getPayments().isEmpty()) {
            // Sẽ trigger lazy load, nhưng an toàn vì đã @Transactional
            Payment firstPayment = invoice.getPayments().get(0);
            if (firstPayment.getPaymentMethod() != null) {
                pm = firstPayment.getPaymentMethod().name();
            }
        }
        dto.setPaymentMethod(pm);

        // (Phần map booking này giờ đã an toàn vì @Transactional)
        List<BookingInfoDTO> bookingDTOs = invoice.getBookings().stream().map(booking -> {
            BookingInfoDTO bDto = new BookingInfoDTO();
            bDto.setBookingId(booking.getBookingId());
            bDto.setBookingDate(booking.getBookingDate());
            bDto.setTimeSlot(booking.getTimeSlot());
            bDto.setVehicleType(booking.getVehicleType());
            bDto.setAmount(booking.getAmount());
            return bDto;
        }).collect(Collectors.toList());

        dto.setBookings(bookingDTOs);
        return dto;
    }

    // (Hàm createInvoice giữ nguyên)
    @Transactional
    public Invoice createInvoice(Invoice invoice) {
        // ... (Giữ nguyên logic)
        invoice.setInvoiceId(null);
        if (invoice.getPricePerSwap() == null) {
            invoice.setPricePerSwap(systemPriceService.getPriceByType(SystemPrice.PriceType.BATTERY_SWAP));
        }
        if (invoice.getCreatedDate() == null) {
            invoice.setCreatedDate(LocalDateTime.now().now());
        }
        if (invoice.getInvoiceStatus() == null) {
            invoice.setInvoiceStatus(Invoice.InvoiceStatus.PENDING);
        }
        return invoiceRepository.save(invoice);
    }

    // (Hàm createInvoiceForBooking giữ nguyên)
    @Transactional
    public Invoice createInvoiceForBooking(Booking booking) {
        // ... (Giữ nguyên logic)
        if (booking.getBookingStatus() == Booking.BookingStatus.PENDINGPAYMENT) {
            throw new IllegalStateException("Không thể tạo invoice cho booking chưa thanh toán");
        }
        if (booking.getBookingStatus() == Booking.BookingStatus.COMPLETED) {
            throw new IllegalStateException("Không thể tạo invoice cho booking đã hoàn thành");
        }
        if (booking.getBookingStatus() == Booking.BookingStatus.CANCELLED) {
            throw new IllegalStateException("Không thể tạo invoice cho booking đã hủy");
        }
        if (booking.getInvoice() != null) {
            throw new IllegalStateException("Booking này đã có invoice rồi. Invoice ID: " + booking.getInvoice().getInvoiceId());
        }
        Invoice invoice = new Invoice();
        invoice.setUserId(booking.getUser().getUserId());
        invoice.setPricePerSwap(booking.getAmount());
        invoice.setNumberOfSwaps(1);
        invoice.setCreatedDate(LocalDateTime.now());
        invoice.setInvoiceStatus(Invoice.InvoiceStatus.PAID);
        invoice.calculateTotalAmount();
        Invoice savedInvoice = invoiceRepository.save(invoice);
        booking.setInvoice(savedInvoice);
        bookingRepository.save(booking);
        return savedInvoice;
    }

    // (Hàm updateInvoice giữ nguyên)
    @Transactional
    public Invoice updateInvoice(Long id, Invoice invoice) {
        // ... (Giữ nguyên logic)
        Invoice existing = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn với ID: " + id));
        existing.setCreatedDate(invoice.getCreatedDate());
        if (invoice.getPricePerSwap() != null) {
            existing.setPricePerSwap(invoice.getPricePerSwap());
        }
        if (invoice.getNumberOfSwaps() != null) {
            existing.setNumberOfSwaps(invoice.getNumberOfSwaps());
        }
        existing.calculateTotalAmount();
        return invoiceRepository.save(existing);
    }

    // (Hàm addBookingToInvoice giữ nguyên)
    @Transactional
    public Invoice addBookingToInvoice(Long invoiceId, Booking booking) {
        // ... (Giữ nguyên logic)
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn với ID: " + invoiceId));
        booking.setInvoice(invoice);
        invoice.setNumberOfSwaps(invoice.getNumberOfSwaps() + 1);
        invoice.calculateTotalAmount();
        return invoiceRepository.save(invoice);
    }

    // (Hàm linkBookingsToInvoice giữ nguyên)
    @Transactional
    public Invoice linkBookingsToInvoice(Long invoiceId, List<Long> bookingIds) {
        // ... (Giữ nguyên logic)
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn với ID: " + invoiceId));
        List<Booking> bookings = bookingRepository.findAllById(bookingIds);
        if (bookings.isEmpty()) {
            throw new RuntimeException("Không tìm thấy booking nào để link");
        }
        if (invoice.getUserId() == null && !bookings.isEmpty()) {
            invoice.setUserId(bookings.get(0).getUser().getUserId());
        }
        List<Booking> alreadyLinked = bookings.stream()
                .filter(b -> b.getInvoice() != null)
                .collect(Collectors.toList());
        if (!alreadyLinked.isEmpty()) {
            String bookingIdsStr = alreadyLinked.stream()
                    .map(b -> String.valueOf(b.getBookingId()))
                    .collect(Collectors.joining(", "));
            throw new RuntimeException("Các booking sau đã được link với invoice khác: " + bookingIdsStr);
        }
        for (Booking booking : bookings) {
            booking.setInvoice(invoice);
            if (booking.getAmount() == null) {
                booking.setAmount(invoice.getPricePerSwap());
            }
            if (booking.getTotalPrice() == null) {
                int batteries = booking.getBatteryCount() != null ? booking.getBatteryCount() : 0;
                booking.setTotalPrice((double) (batteries * invoice.getPricePerSwap()));
            }
        }
        bookingRepository.saveAll(bookings);
        invoice.setNumberOfSwaps(bookings.size());
        double totalAmount = bookings.stream()
                .mapToDouble(b -> b.getTotalPrice() != null ? b.getTotalPrice() : 0.0)
                .sum();
        invoice.setTotalAmount(totalAmount);
        return invoiceRepository.save(invoice);
    }

    // (Hàm createInvoiceWithBookings giữ nguyên)
    @Transactional
    public Invoice createInvoiceWithBookings(List<Long> bookingIds) {
        // ... (Giữ nguyên logic)
        Invoice invoice = new Invoice();
        invoice.setPricePerSwap(systemPriceService.getPriceByType(SystemPrice.PriceType.BATTERY_SWAP));
        invoice.setCreatedDate(LocalDateTime.now());
        invoice.setNumberOfSwaps(0);
        invoice.setTotalAmount(0.0);
        Invoice savedInvoice = invoiceRepository.save(invoice);
        if (bookingIds != null && !bookingIds.isEmpty()) {
            return linkBookingsToInvoice(savedInvoice.getInvoiceId(), bookingIds);
        }
        return savedInvoice;
    }

    // (Hàm unlinkBookingFromInvoice giữ nguyên)
    @Transactional
    public void unlinkBookingFromInvoice(Long bookingId) {
        // ... (Giữ nguyên logic)
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy booking với ID: " + bookingId));
        if (booking.getInvoice() != null) {
            Invoice invoice = booking.getInvoice();
            booking.setInvoice(null);
            bookingRepository.save(booking);
            invoice.setNumberOfSwaps(Math.max(0, invoice.getNumberOfSwaps() - 1));
            invoice.calculateTotalAmount();
            invoiceRepository.save(invoice);
        }
    }

    // (Hàm deleteInvoice giữ nguyên)
    @Transactional
    public void deleteInvoice(Long id) {
        // ... (Giữ nguyên logic)
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn với ID: " + id));
        if (invoice.getBookings() != null && !invoice.getBookings().isEmpty()) {
            for (Booking booking : invoice.getBookings()) {
                booking.setInvoice(null);
            }
            bookingRepository.saveAll(invoice.getBookings());
        }
        invoiceRepository.deleteById(id);
    }

    // (Hàm getAllInvoices giữ nguyên)
    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    // (Hàm getInvoiceById giữ nguyên)
    public Invoice getInvoiceById(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn với ID: " + id));
    }

    /**
     * Lấy chi tiết invoice với DTO đơn giản, tránh circular reference
     * ✅ [CẬP NHẬT] Thêm @Transactional và 2 trường mới
     */
    @Transactional(readOnly = true) // <-- THÊM MỚI (Rất quan trọng để fix lỗi Lazy loading)
    public InvoiceSimpleResponseDTO getInvoiceSimple(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn với ID: " + invoiceId));

        // (Phần map simpleBookings này giờ đã an toàn vì @Transactional)
        List<InvoiceSimpleResponseDTO.SimpleBookingInfo> simpleBookings = invoice.getBookings().stream()
                .map(booking -> InvoiceSimpleResponseDTO.SimpleBookingInfo.builder()
                        .bookingId(booking.getBookingId())
                        .bookingDate(booking.getBookingDate())
                        .timeSlot(booking.getTimeSlot())
                        .vehicleType(booking.getVehicleType())
                        .amount(booking.getAmount())
                        .bookingStatus(booking.getBookingStatus().toString())
                        .stationId(booking.getStation().getStationId())
                        .stationName(booking.getStation().getStationName())
                        .stationAddress(booking.getStation().getAddress())
                        .vehicleId(booking.getVehicle().getVehicleId())
                        .licensePlate(booking.getVehicle().getLicensePlate())
                        .vehicleBatteryType(booking.getVehicle().getBatteryType().toString())
                        .build())
                .collect(Collectors.toList());

        // (Phần map simplePlanInfo này giờ đã an toàn vì @Transactional)
        InvoiceSimpleResponseDTO.SimplePlanInfo simplePlanInfo = null;
        if (invoice.getPlanToActivate() != null) {
            SubscriptionPlan plan = invoice.getPlanToActivate();
            simplePlanInfo = InvoiceSimpleResponseDTO.SimplePlanInfo.builder()
                    .planId(plan.getId())
                    .planName(plan.getPlanName())
                    .description(plan.getDescription())
                    .durationInDays(plan.getDurationInDays())
                    .priceType(plan.getPriceType() != null ? plan.getPriceType().toString() : null)
                    .swapLimit(plan.getSwapLimit())
                    .build();
        }

        // ✅ [LOGIC MỚI] - Lấy PaymentMethod (trước khi build)
        String pm = null;
        if (invoice.getTotalAmount() != null && invoice.getTotalAmount() == 0) {
            pm = "SUBSCRIPTION"; // Gói cước
        } else if (invoice.getPayments() != null && !invoice.getPayments().isEmpty()) {
            // Sẽ trigger lazy load, nhưng an toàn vì đã @Transactional
            Payment firstPayment = invoice.getPayments().get(0);
            if (firstPayment.getPaymentMethod() != null) {
                pm = firstPayment.getPaymentMethod().name();
            }
        }

        return InvoiceSimpleResponseDTO.builder()
                .invoiceId(invoice.getInvoiceId())
                .userId(invoice.getUserId())
                .createdDate(invoice.getCreatedDate())
                .totalAmount(invoice.getTotalAmount())
                .pricePerSwap(invoice.getPricePerSwap())
                .numberOfSwaps(invoice.getNumberOfSwaps())
                .bookings(simpleBookings)
                .invoiceStatus(invoice.getInvoiceStatus().toString())
                .planToActivate(simplePlanInfo)
                // ✅ [THÊM 2 TRƯỜNG MỚI]
                .invoiceType(invoice.getInvoiceType() != null ? invoice.getInvoiceType().name() : "BOOKING")
                .paymentMethod(pm)
                .build();
    }

    /**
     * Tạo invoice và trả về DTO đơn giản
     */
    @Transactional
    public InvoiceSimpleResponseDTO createInvoiceSimple(Invoice invoice) {
        Invoice savedInvoice = createInvoice(invoice);
        return getInvoiceSimple(savedInvoice.getInvoiceId());
    }

    /**
     * Lọc Invoices theo trạng thái (PENDING/ PAID/ PAYMENTFAILED)
     */
    @Transactional(readOnly = true)
    public List<InvoiceSimpleResponseDTO> getInvoicesByStatus(String statusString) {
        Invoice.InvoiceStatus status;
        String upperStatus = statusString.trim().toUpperCase();

        if ("PENDING".equals(upperStatus)) {
            status = Invoice.InvoiceStatus.PENDING;
        } else if ("PAID".equals(upperStatus)) {
            status = Invoice.InvoiceStatus.PAID;
        } else if ("PAYMENTFAILED".equals(upperStatus)) {
            status = Invoice.InvoiceStatus.PAYMENTFAILED;
        } else {
            throw new IllegalArgumentException(
                    "Trạng thái không hợp lệ: " + statusString +
                            ". Chỉ chấp nhận PENDING, PAID hoặc PAYMENTFAILED."
            );
        }

        // ⚡ Lấy danh sách invoices theo status
        List<Invoice> invoices = invoiceRepository.findByInvoiceStatus(status);

        // ⚡ QUAN TRỌNG: Nếu có invoices, fetch tất cả relationships một lần
        // để tránh N+1 problem
        if (!invoices.isEmpty()) {
            // Batch fetch bookings, stations, vehicles, planToActivate
            // (Hibernate sẽ tự động fetch nếu chúng được đánh dấu LAZY)
            invoices.forEach(inv -> {
                inv.getBookings().size(); // Force initialize bookings
                inv.getBookings().forEach(b -> {
                    if (b.getStation() != null) b.getStation().getStationId();
                    if (b.getVehicle() != null) b.getVehicle().getVehicleId();
                });
                if (inv.getPlanToActivate() != null) inv.getPlanToActivate().getId();
                inv.getPayments().size(); // Force initialize payments
            });
        }

        // ⚡ Chuyển đổi sang DTO (không query thêm vì đã fetch sẵn)
        return invoices.stream()
                .map(this::buildInvoiceSimpleFromFetched)
                .collect(Collectors.toList());
    }

    /**
     * Logic cho API hủy invoice (chạy thủ công)
     */
    @Transactional
    public void userCancelInvoice(Long invoiceId) {
        // ... (Giữ nguyên logic)
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Invoice ID: " + invoiceId));
        if (invoice.getInvoiceStatus() != Invoice.InvoiceStatus.PENDING) {
            throw new IllegalStateException("Bạn chỉ có thể hủy invoice đang ở trạng thái PENDING. " +
                    "Invoice này đang ở trạng thái: " + invoice.getInvoiceStatus());
        }
        invoice.setInvoiceStatus(Invoice.InvoiceStatus.PAYMENTFAILED);
        List<Booking> bookings = bookingRepository.findAllByInvoice(invoice);
        for (Booking booking : bookings) {
            booking.setBookingStatus(Booking.BookingStatus.FAILED);
        }
        List<Payment> payments = paymentRepository.findAllByInvoice(invoice);
        if (payments != null && !payments.isEmpty()) {
            for (Payment payment : payments) {
                payment.setPaymentStatus(Payment.PaymentStatus.FAILED);
            }
            paymentRepository.saveAll(payments);
        }
        invoiceRepository.save(invoice);
        bookingRepository.saveAll(bookings);
    }

    @Transactional(readOnly = true)
    public InvoiceSimpleResponseDTO buildInvoiceSimpleFromFetched(Invoice invoice) {

        if (invoice.getRefundedBookings() != null && !invoice.getRefundedBookings().isEmpty()) {

            if (invoice.getBookings() == null) {
                invoice.setBookings(new java.util.ArrayList<>());
            }

            invoice.getBookings().addAll(invoice.getRefundedBookings());
        }
        // ✅ Dữ liệu đã được JOIN FETCH -> không cần query lại
        List<InvoiceSimpleResponseDTO.SimpleBookingInfo> simpleBookings = invoice.getBookings().stream()
                .map(booking -> InvoiceSimpleResponseDTO.SimpleBookingInfo.builder()
                        .bookingId(booking.getBookingId())
                        .bookingDate(booking.getBookingDate())
                        .timeSlot(booking.getTimeSlot())
                        .vehicleType(booking.getVehicleType() != null ? booking.getVehicleType() : "") // ✅ Fix null for vehicleType
                        .amount(booking.getAmount() != null ? booking.getAmount() : 0.0) // ✅ Fix null
                        .bookingStatus(booking.getBookingStatus() != null ? booking.getBookingStatus().toString() : "UNKNOWN")
                        .batteryCount(booking.getBatteryCount() != null ? booking.getBatteryCount() : 0) // ✅ Fix null
                        .batteryType(booking.getBatteryType() != null ? booking.getBatteryType() : "") // ✅ Fix null
                        .stationId(booking.getStation() != null ? booking.getStation().getStationId() : null)
                        .stationName(booking.getStation() != null ? booking.getStation().getStationName() : "") // ✅ Already has null check
                        .stationAddress(booking.getStation() != null ? booking.getStation().getAddress() : "") // ✅ Already has null check
                        .vehicleId(booking.getVehicle() != null ? booking.getVehicle().getVehicleId() : null)
                        .licensePlate(booking.getVehicle() != null ? booking.getVehicle().getLicensePlate() : "") // ✅ Already has null check
                        .vehicleBatteryType(booking.getVehicle() != null && booking.getVehicle().getBatteryType() != null
                                ? booking.getVehicle().getBatteryType().toString()
                                : "") // ✅ Already has null check
                        .build())
                .collect(Collectors.toList());

        InvoiceSimpleResponseDTO.SimplePlanInfo simplePlanInfo = null;
        if (invoice.getPlanToActivate() != null) {
            var plan = invoice.getPlanToActivate();
            simplePlanInfo = InvoiceSimpleResponseDTO.SimplePlanInfo.builder()
                    .planId(plan.getId())
                    .planName(plan.getPlanName() != null ? plan.getPlanName() : "") // ✅ Fix null
                    .description(plan.getDescription() != null ? plan.getDescription() : "") // ✅ Fix null
                    .durationInDays(plan.getDurationInDays() != null ? plan.getDurationInDays() : 0) // ✅ Fix null
                    .priceType(plan.getPriceType() != null ? plan.getPriceType().toString() : "")
                    .swapLimit(plan.getSwapLimit() != null ? plan.getSwapLimit() : 0) // ✅ Fix null
                    .build();
        }

        // ✅ Fetch payments riêng từ repository để tránh MultipleBagFetchException
        InvoiceSimpleResponseDTO.SimplePaymentInfo paymentInfo = null;
        String paymentMethod = null; // ✅ Thêm biến paymentMethod để set vào DTO chính
        List<Payment> payments = invoice.getPayments(); // Lấy từ invoice đã fetch

        if (payments != null && !payments.isEmpty()) {
            // Ưu tiên lấy payment REFUND nếu có, nếu không thì lấy payment đầu tiên
            Payment payment = payments.stream()
                    .filter(p -> p.getTransactionType() == Payment.TransactionType.REFUND)
                    .findFirst()
                    .orElse(payments.get(0));

            // ✅ Set paymentMethod từ payment
            paymentMethod = payment.getPaymentMethod() != null ? payment.getPaymentMethod().name() : "";

            // ✅ Tính displayAmount CHỈ dựa trên TransactionType và WALLET_TOPUP
            String displayAmount;
            boolean isPositive = payment.getTransactionType() == Payment.TransactionType.REFUND
                    || invoice.getInvoiceType() == Invoice.InvoiceType.WALLET_TOPUP;

            if (isPositive) {
                // REFUND hoặc nạp tiền vào ví -> hiển thị dấu +
                displayAmount = "+" + String.format("%.0f", payment.getAmount()); // primitive double, no null check needed
            } else {
                // PAYMENT thông thường (booking, subscription, penalty) -> hiển thị dấu -
                displayAmount = "-" + String.format("%.0f", payment.getAmount()); // primitive double, no null check needed
            }

            paymentInfo = InvoiceSimpleResponseDTO.SimplePaymentInfo.builder()
                    .paymentId(payment.getPaymentId())
                    .transactionType(payment.getTransactionType() != null ? payment.getTransactionType().name() : "PAYMENT")
                    .amount(payment.getAmount()) // ✅ primitive double - no null check needed
                    .displayAmount(displayAmount)
                    .paymentMethod(paymentMethod)
                    .paymentStatus(payment.getPaymentStatus() != null ? payment.getPaymentStatus().name() : "PENDING")
                    .createdAt(payment.getCreatedAt())
                    .gateway(payment.getGateway() != null ? payment.getGateway() : "") // ✅ Fix null
                    .vnpTransactionNo(payment.getVnpTransactionNo() != null ? payment.getVnpTransactionNo() : "") // ✅ Fix null
                    .build();
        }

        return InvoiceSimpleResponseDTO.builder()
                .invoiceId(invoice.getInvoiceId())
                .userId(invoice.getUserId() != null ? invoice.getUserId() : "") // ✅ Fix null - THÊM FIELD này
                .invoiceStatus(invoice.getInvoiceStatus() != null ? invoice.getInvoiceStatus().toString() : "PENDING")
                .invoiceType(invoice.getInvoiceType() != null ? invoice.getInvoiceType().toString() : "BOOKING")
                .totalAmount(invoice.getTotalAmount() != null ? invoice.getTotalAmount() : 0.0) // ✅ Fix null
                .pricePerSwap(invoice.getPricePerSwap() != null ? invoice.getPricePerSwap() : 0.0) // ✅ Fix null - THÊM FIELD này
                .numberOfSwaps(invoice.getNumberOfSwaps() != null ? invoice.getNumberOfSwaps() : 0) // ✅ Fix null - THÊM FIELD này
                .createdDate(invoice.getCreatedDate()) // LocalDateTime có thể null, FE sẽ xử lý
                .bookings(simpleBookings)             // ✅ giữ nguyên key FE đang dùng
                .planToActivate(simplePlanInfo)       // ✅ giữ nguyên key FE đang dùng
                .paymentInfo(paymentInfo)             // ✅ Thêm thông tin payment
                .paymentMethod(paymentMethod != null ? paymentMethod : "") // ✅ Fix null - THÊM FIELD này
                .build();
    }
}