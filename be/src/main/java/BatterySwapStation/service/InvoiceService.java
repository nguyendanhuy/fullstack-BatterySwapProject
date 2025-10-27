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
     */
    public InvoiceResponseDTO getInvoiceDetail(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn với ID: " + invoiceId));

        InvoiceResponseDTO dto = new InvoiceResponseDTO();
        dto.setId(invoice.getInvoiceId());
        dto.setCreatedDate(invoice.getCreatedDate());
        dto.setTotalAmount(invoice.getTotalAmount());
        dto.setPricePerSwap(invoice.getPricePerSwap());
        dto.setNumberOfSwaps(invoice.getNumberOfSwaps());

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

    /**
     * Tạo invoice mới và tự động tính toán tổng tiền
     */
    /**
     * Tạo invoice mới (ĐÃ SỬA LỖI)
     * [SỬA] Đã xóa 'calculateTotalAmount()' vì nó gây ra lỗi setTotalAmount = 0
     * vì các giá trị đã được Controller tính toán trước.
     */
    @Transactional
    public Invoice createInvoice(Invoice invoice) {
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


    /**
     * Tạo invoice cho booking sau khi thanh toán
     */
    @Transactional
    public Invoice createInvoiceForBooking(Booking booking) {
        // Kiểm tra trạng thái booking - chỉ tạo invoice cho booking đã thanh toán (PENDINGSWAPPING trở lên)
        if (booking.getBookingStatus() == Booking.BookingStatus.PENDINGPAYMENT) {
            throw new IllegalStateException("Không thể tạo invoice cho booking chưa thanh toán");
        }

        // Kiểm tra trạng thái booking - KHÔNG cho phép tạo invoice từ booking đã hoàn thành
        if (booking.getBookingStatus() == Booking.BookingStatus.COMPLETED) {
            throw new IllegalStateException("Không thể tạo invoice cho booking đã hoàn thành");
        }

        // Kiểm tra booking đã hủy
        if (booking.getBookingStatus() == Booking.BookingStatus.CANCELLED) {
            throw new IllegalStateException("Không thể tạo invoice cho booking đã hủy");
        }

        // Kiểm tra booking đã có invoice chưa
        if (booking.getInvoice() != null) {
            throw new IllegalStateException("Booking này đã có invoice rồi. Invoice ID: " + booking.getInvoice().getInvoiceId());
        }

        Invoice invoice = new Invoice();
        invoice.setUserId(booking.getUser().getUserId()); // Set userId từ booking
        invoice.setPricePerSwap(booking.getAmount());
        invoice.setNumberOfSwaps(1);
        invoice.setCreatedDate(LocalDateTime.now());
        invoice.setInvoiceStatus(Invoice.InvoiceStatus.PAID); // Set status PAID vì booking đã thanh toán

        // Tính tổng tiền
        invoice.calculateTotalAmount();

        // Lưu invoice trước
        Invoice savedInvoice = invoiceRepository.save(invoice);

        // Cập nhật booking với invoice
        booking.setInvoice(savedInvoice);
        bookingRepository.save(booking);

        return savedInvoice;
    }

    /**
     * Cập nhật invoice và tính lại tổng tiền
     */
    @Transactional
    public Invoice updateInvoice(Long id, Invoice invoice) {
        Invoice existing = invoiceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn với ID: " + id));

        existing.setCreatedDate(invoice.getCreatedDate());

        // Cập nhật giá và số lần đổi nếu có
        if (invoice.getPricePerSwap() != null) {
            existing.setPricePerSwap(invoice.getPricePerSwap());
        }

        if (invoice.getNumberOfSwaps() != null) {
            existing.setNumberOfSwaps(invoice.getNumberOfSwaps());
        }

        // Tính lại tổng tiền
        existing.calculateTotalAmount();

        return invoiceRepository.save(existing);
    }

    /**
     * Thêm booking vào invoice và cập nhật tổng tiền
     */
    @Transactional
    public Invoice addBookingToInvoice(Long invoiceId, Booking booking) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn với ID: " + invoiceId));

        // Thêm booking vào invoice
        booking.setInvoice(invoice);

        // Tăng số lần đổi pin
        invoice.setNumberOfSwaps(invoice.getNumberOfSwaps() + 1);

        // Tính lại tổng tiền
        invoice.calculateTotalAmount();

        return invoiceRepository.save(invoice);
    }

    /**
     * Link nhiều booking vào 1 invoice và tự động tính tổng tiền
     * [ĐÃ CẬP NHẬT LOGIC]
     * * @param invoiceId ID của invoice cần link
     * @param bookingIds Danh sách ID của các booking cần link
     * @return Invoice đã được cập nhật
     */
    @Transactional
    public Invoice linkBookingsToInvoice(Long invoiceId, List<Long> bookingIds) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn với ID: " + invoiceId));

        List<Booking> bookings = bookingRepository.findAllById(bookingIds);

        if (bookings.isEmpty()) {
            throw new RuntimeException("Không tìm thấy booking nào để link");
        }

        if (invoice.getUserId() == null && !bookings.isEmpty()) {
            invoice.setUserId(bookings.get(0).getUser().getUserId());
        }

        // Kiểm tra booking đã có invoice
        List<Booking> alreadyLinked = bookings.stream()
                .filter(b -> b.getInvoice() != null)
                .collect(Collectors.toList());

        if (!alreadyLinked.isEmpty()) {
            String bookingIdsStr = alreadyLinked.stream()
                    .map(b -> String.valueOf(b.getBookingId()))
                    .collect(Collectors.joining(", "));
            throw new RuntimeException("Các booking sau đã được link với invoice khác: " + bookingIdsStr);
        }

        // Link các booking vào invoice
        for (Booking booking : bookings) {
            booking.setInvoice(invoice);

            // Đặt giá cho booking nếu nó chưa có
            if (booking.getAmount() == null) {
                booking.setAmount(invoice.getPricePerSwap());
            }

            // ✅ Đặt totalPrice nếu chưa có (backward compatibility)
            if (booking.getTotalPrice() == null) {
                int batteries = booking.getBatteryCount() != null ? booking.getBatteryCount() : 0;
                booking.setTotalPrice((double) (batteries * invoice.getPricePerSwap()));
            }
        }

        bookingRepository.saveAll(bookings);

        // ✅ SỬA LOGIC: Lấy tổng giá từ booking (đã tính gói tháng)
        invoice.setNumberOfSwaps(bookings.size());

        double totalAmount = bookings.stream()
                .mapToDouble(b -> b.getTotalPrice() != null ? b.getTotalPrice() : 0.0)
                .sum();

        invoice.setTotalAmount(totalAmount);

        return invoiceRepository.save(invoice);
    }

    /**
     * Tạo invoice mới và link với các booking
     * @param bookingIds Danh sách ID của các booking cần link
     * @return Invoice mới được tạo
     */
    @Transactional
    public Invoice createInvoiceWithBookings(List<Long> bookingIds) {
        // Tạo invoice mới
        Invoice invoice = new Invoice();
        invoice.setPricePerSwap(systemPriceService.getPriceByType(SystemPrice.PriceType.BATTERY_SWAP));
        invoice.setCreatedDate(LocalDateTime.now());
        invoice.setNumberOfSwaps(0);
        invoice.setTotalAmount(0.0);

        // Lưu invoice trước
        Invoice savedInvoice = invoiceRepository.save(invoice);

        // Link các booking vào invoice
        if (bookingIds != null && !bookingIds.isEmpty()) {
            return linkBookingsToInvoice(savedInvoice.getInvoiceId(), bookingIds);
        }

        return savedInvoice;
    }

    /**
     * Gỡ link booking khỏi invoice
     * @param bookingId ID của booking cần gỡ link
     */
    @Transactional
    public void unlinkBookingFromInvoice(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy booking với ID: " + bookingId));

        if (booking.getInvoice() != null) {
            Invoice invoice = booking.getInvoice();
            booking.setInvoice(null);
            bookingRepository.save(booking);

            // Cập nhật lại invoice
            invoice.setNumberOfSwaps(Math.max(0, invoice.getNumberOfSwaps() - 1));
            invoice.calculateTotalAmount();
            invoiceRepository.save(invoice);
        }
    }

    /**
     * Xóa invoice
     */
    @Transactional
    public void deleteInvoice(Long id) {
        // Lấy invoice trước
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn với ID: " + id));

        // Gỡ link tất cả booking khỏi invoice trước khi xóa
        if (invoice.getBookings() != null && !invoice.getBookings().isEmpty()) {
            for (Booking booking : invoice.getBookings()) {
                booking.setInvoice(null);
            }
            bookingRepository.saveAll(invoice.getBookings());
        }

        // Bây giờ mới xóa invoice
        invoiceRepository.deleteById(id);
    }

    /**
     * Lấy tất cả invoice
     */
    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    /**
     * Lấy invoice theo ID
     */
    public Invoice getInvoiceById(Long id) {
        return invoiceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn với ID: " + id));
    }

    /**
     * Lấy chi tiết invoice với DTO đơn giản, tránh circular reference
     */
    public InvoiceSimpleResponseDTO getInvoiceSimple(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn với ID: " + invoiceId));

        List<InvoiceSimpleResponseDTO.SimpleBookingInfo> simpleBookings = invoice.getBookings().stream()
            .map(booking -> InvoiceSimpleResponseDTO.SimpleBookingInfo.builder()
                .bookingId(booking.getBookingId())
                .bookingDate(booking.getBookingDate())
                .timeSlot(booking.getTimeSlot())
                .vehicleType(booking.getVehicleType())
                .amount(booking.getAmount())
                .bookingStatus(booking.getBookingStatus().toString())
                // Chỉ lấy thông tin cơ bản của station
                .stationId(booking.getStation().getStationId())
                .stationName(booking.getStation().getStationName())
                .stationAddress(booking.getStation().getAddress())
                // Chỉ lấy thông tin cơ bản của vehicle
                .vehicleId(booking.getVehicle().getVehicleId())
                .licensePlate(booking.getVehicle().getLicensePlate())
                .vehicleBatteryType(booking.getVehicle().getBatteryType().toString())
                .build())
            .collect(Collectors.toList());

        // Map thông tin planToActivate nếu có
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
    public List<InvoiceSimpleResponseDTO> getInvoicesByStatus(String statusString) {
        Invoice.InvoiceStatus status;
        String upperStatus = statusString.trim().toUpperCase();

        // ✅ LOGIC CẬP NHẬT: Chỉ chấp nhận PENDING, PAID, PAYMENTFAILED
        if ("PENDING".equals(upperStatus)) {
            status = Invoice.InvoiceStatus.PENDING;
        } else if ("PAID".equals(upperStatus)) {
            status = Invoice.InvoiceStatus.PAID;
        } else if ("PAYMENTFAILED".equals(upperStatus)) {
            status = Invoice.InvoiceStatus.PAYMENTFAILED;
        } else {
            // Ném lỗi nếu nhập trạng thái khác
            throw new IllegalArgumentException(
                    "Trạng thái không hợp lệ: " + statusString +
                            ". Chỉ chấp nhận PENDING, PAID hoặc PAYMENTFAILED."
            );
        }

        // Gọi phương thức Repository
        List<Invoice> invoices = invoiceRepository.findByInvoiceStatus(status);

        // Chuyển đổi sang DTO
        return invoices.stream()
                .map(invoice -> getInvoiceSimple(invoice.getInvoiceId()))
                .collect(Collectors.toList());
    }

    /**
     * Logic cho API hủy invoice (chạy thủ công)
     */
    @Transactional
    public void userCancelInvoice(Long invoiceId) {
        // 1. Tìm invoice
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Invoice ID: " + invoiceId));

        // 2. Kiểm tra trạng thái
        if (invoice.getInvoiceStatus() != Invoice.InvoiceStatus.PENDING) {
            throw new IllegalStateException("Bạn chỉ có thể hủy invoice đang ở trạng thái PENDING. " +
                    "Invoice này đang ở trạng thái: " + invoice.getInvoiceStatus());
        }

        // 3. Cập nhật Invoice status
        // (Chúng ta sẽ dùng status PAYMENTFAILED của scheduler,
        // hoặc bạn có thể tạo status mới là 'CANCELLED')
        invoice.setInvoiceStatus(Invoice.InvoiceStatus.PAYMENTFAILED);

        // 4. Cập nhật Booking status (liên kết)
        List<Booking> bookings = bookingRepository.findAllByInvoice(invoice);
        for (Booking booking : bookings) {
            booking.setBookingStatus(Booking.BookingStatus.FAILED);
        }

        // 5. Cập nhật Payment status (liên kết)
        Payment payment = paymentRepository.findByInvoice(invoice);
        if (payment != null) {
            payment.setPaymentStatus(Payment.PaymentStatus.FAILED);
            paymentRepository.save(payment);
        }

        // 6. Lưu thay đổi
        invoiceRepository.save(invoice);
        bookingRepository.saveAll(bookings);

        // (Ghi log nếu cần)
        // logger.info("Người dùng đã chủ động hủy Invoice #{}", invoice.getInvoiceId());
    }
}
