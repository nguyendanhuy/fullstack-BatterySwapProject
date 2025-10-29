package BatterySwapStation.service;

import BatterySwapStation.entity.Booking;
import BatterySwapStation.entity.Invoice;
import BatterySwapStation.entity.Payment;
import BatterySwapStation.repository.BookingRepository;
import BatterySwapStation.repository.InvoiceRepository;
import BatterySwapStation.repository.PaymentRepository;

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

    @Autowired
    private PaymentRepository paymentRepository;

    /**
     * Tự động chạy mỗi phút để kiểm tra các invoice quá hạn
     * (fixedRate = 60000 milliseconds)
     */
    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void checkPendingInvoiceTimeouts() {

        // 1. Tính toán thời gian hết hạn (Giữ nguyên)
        LocalDateTime timeoutTime = LocalDateTime.now().minusMinutes(TIMEOUT_MINUTES);

        // 2. Tìm tất cả các invoice PENDING đã quá hạn (Giữ nguyên)
        List<Invoice> expiredInvoices = invoiceRepository.findPendingInvoicesOlderThan(
                Invoice.InvoiceStatus.PENDING,
                timeoutTime
        );

        if (expiredInvoices.isEmpty()) {
            return; // Không có gì để làm
        }

        logger.info("[Scheduler] Phát hiện {} invoice quá hạn. Đang xử lý...", expiredInvoices.size());

        for (Invoice invoice : expiredInvoices) {

            // 3. Cập nhật Invoice status (Giữ nguyên)
            invoice.setInvoiceStatus(Invoice.InvoiceStatus.PAYMENTFAILED);

            // 4. Cập nhật Booking status (Giữ nguyên)
            List<Booking> bookings = bookingRepository.findAllByInvoice(invoice);
            for (Booking booking : bookings) {
                booking.setBookingStatus(Booking.BookingStatus.FAILED);
            }

            // ========== ✅ [BƯỚC 5 ĐÃ SỬA LỖI] ==========

            // 1. Dùng hàm mới (trả về List)
            // (Bạn phải sửa tệp PaymentRepository.java để có hàm này)
            List<Payment> payments = paymentRepository.findAllByInvoice(invoice);

            // 2. Lặp qua TẤT CẢ payment và cập nhật
            if (payments != null && !payments.isEmpty()) {
                for (Payment p : payments) {
                    if (p.getPaymentStatus() == Payment.PaymentStatus.PENDING) {
                        p.setPaymentStatus(Payment.PaymentStatus.FAILED);
                    }
                }
                paymentRepository.saveAll(payments); // 3. Lưu tất cả thay đổi
            }
            // =============================================


            // 6. Lưu thay đổi (Giữ nguyên)
            invoiceRepository.save(invoice);
            bookingRepository.saveAll(bookings);

            logger.info("[Scheduler] Đã cập nhật Invoice #{} sang PAYMENTFAILED.", invoice.getInvoiceId());
        }
    }
}