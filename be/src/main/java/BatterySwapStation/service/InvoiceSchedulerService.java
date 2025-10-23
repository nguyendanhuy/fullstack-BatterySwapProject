package BatterySwapStation.service;

import BatterySwapStation.entity.Booking;
import BatterySwapStation.entity.Invoice;
import BatterySwapStation.entity.Payment; // (Giả định bạn có Entity này)
import BatterySwapStation.repository.BookingRepository;
import BatterySwapStation.repository.InvoiceRepository;
import BatterySwapStation.repository.PaymentRepository; // (Giả định bạn có Repo này)

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class InvoiceSchedulerService {

    private static final Logger logger = LoggerFactory.getLogger(InvoiceSchedulerService.class);

    // Đặt thời gian timeout là 15 phút
    private static final int TIMEOUT_MINUTES = 15;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private BookingRepository bookingRepository;

    // Giả định bạn có PaymentRepository và Payment.java
    @Autowired
    private PaymentRepository paymentRepository;

    /**
     * Tự động chạy mỗi phút để kiểm tra các invoice quá hạn
     * (fixedRate = 60000 milliseconds)
     */
    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void checkPendingInvoiceTimeouts() {

        // ✅ "BƯỚC BẠN HỎI" NẰM Ở ĐÂY:
        // 1. Tính toán thời gian hết hạn (15 phút trước)
        LocalDateTime timeoutTime = LocalDateTime.now().minusMinutes(TIMEOUT_MINUTES);

        // 2. Tìm tất cả các invoice PENDING đã quá hạn
        List<Invoice> expiredInvoices = invoiceRepository.findPendingInvoicesOlderThan(
                Invoice.InvoiceStatus.PENDING,
                timeoutTime // <-- Sử dụng logic 15 phút chính xác
        );
        // (Logic 'LocalDate.now().minusDays(1)' cũ đã bị thay thế)

        if (expiredInvoices.isEmpty()) {
            return; // Không có gì để làm
        }

        logger.info("[Scheduler] Phát hiện {} invoice quá hạn. Đang xử lý...", expiredInvoices.size());

        for (Invoice invoice : expiredInvoices) {

            // 3. Cập nhật Invoice status
            invoice.setInvoiceStatus(Invoice.InvoiceStatus.PAYMENTFAILED);

            // 4. Cập nhật Booking status
            // (Cần tải các booking liên quan)
            List<Booking> bookings = bookingRepository.findAllByInvoice(invoice);
            for (Booking booking : bookings) {
                booking.setBookingStatus(Booking.BookingStatus.FAILED);
            }

            // 5. Cập nhật Payment status (Nếu có)
            Payment payment = paymentRepository.findByInvoice(invoice);
            if (payment != null) {
                payment.setPaymentStatus(Payment.PaymentStatus.FAILED);
                paymentRepository.save(payment);
            }

            // 6. Lưu thay đổi
            invoiceRepository.save(invoice);
            bookingRepository.saveAll(bookings);

            logger.info("[Scheduler] Đã cập nhật Invoice #{} sang PAYMENTFAILED.", invoice.getInvoiceId());
        }
    }
}