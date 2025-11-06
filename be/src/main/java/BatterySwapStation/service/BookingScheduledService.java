package BatterySwapStation.service;

import BatterySwapStation.entity.Booking;
import BatterySwapStation.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingScheduledService {

    private final BookingRepository bookingRepository;

    /**
     * Tự động hủy các booking PENDINGPAYMENT đã quá hạn 30 phút
     * Chạy mỗi 10 phút
     */
    @Scheduled(fixedDelay = 600000) // 10 phút = 600,000 ms
    @Transactional
    public void autoCancelExpiredPendingPaymentBookings() {
        log.info("🔍 Bắt đầu kiểm tra và hủy booking PENDINGPAYMENT quá hạn...");

        try {
            // Lấy tất cả booking PENDINGPAYMENT
            List<Booking> pendingBookings = bookingRepository.findByBookingStatus(Booking.BookingStatus.PENDINGPAYMENT);

            if (pendingBookings.isEmpty()) {
                log.info("Không có booking PENDINGPAYMENT nào cần kiểm tra.");
                return;
            }

            LocalDateTime now = LocalDateTime.now();
            int cancelledCount = 0;

            for (Booking booking : pendingBookings) {
                // Tính thời gian đã tạo booking (giả sử booking được tạo vào ngày bookingDate)
                // Nếu có field createdAt thì dùng createdAt, không thì dùng bookingDate + timeSlot
                LocalDateTime bookingDateTime = LocalDateTime.of(booking.getBookingDate(), booking.getTimeSlot());

                // Nếu booking được tạo cách đây hơn 30 phút và vẫn chưa thanh toán -> Hủy
                // Hoặc nếu booking đã qua thời gian đặt -> Hủy
                LocalDateTime expiryTime = bookingDateTime.minusMinutes(30);

                if (now.isAfter(bookingDateTime) || now.isAfter(expiryTime)) {
                    booking.setBookingStatus(Booking.BookingStatus.CANCELLED);
                    booking.setCancellationReason("Tự động hủy: Không thanh toán trong thời gian quy định");
                    bookingRepository.save(booking);
                    cancelledCount++;

                    log.info("Đã hủy booking #{} - User: {} - Ngày: {} - Giờ: {}",
                            booking.getBookingId(),
                            booking.getUser().getUserId(),
                            booking.getBookingDate(),
                            booking.getTimeSlot());
                }
            }

            if (cancelledCount > 0) {
                log.info("Đã hủy {} booking PENDINGPAYMENT quá hạn.", cancelledCount);
            } else {
                log.info("Không có booking PENDINGPAYMENT nào quá hạn.");
            }

        } catch (Exception e) {
            log.error("Lỗi khi tự động hủy booking: {}", e.getMessage(), e);
        }
    }

    /**
     * Tự động chuyển booking PENDINGSWAPPING sang FAILED nếu quá thời gian đặt 2 tiếng
     * Chạy mỗi 30 phút
     */
    @Scheduled(fixedDelay = 1800000) // 30 phút = 1,800,000 ms
    @Transactional
    public void autoMarkExpiredSwappingBookingsAsFailed() {
        log.info("🔍 Bắt đầu kiểm tra booking PENDINGSWAPPING quá hạn...");

        try {
            List<Booking> swappingBookings = bookingRepository.findByBookingStatus(Booking.BookingStatus.PENDINGSWAPPING);

            if (swappingBookings.isEmpty()) {
                log.info("Không có booking PENDINGSWAPPING nào cần kiểm tra.");
                return;
            }

            LocalDateTime now = LocalDateTime.now();
            int failedCount = 0;

            for (Booking booking : swappingBookings) {
                LocalDateTime bookingDateTime = LocalDateTime.of(booking.getBookingDate(), booking.getTimeSlot());
                LocalDateTime expiryTime = bookingDateTime.plusHours(2); // Quá 2 tiếng sau giờ đặt

                if (now.isAfter(expiryTime)) {
                    booking.setBookingStatus(Booking.BookingStatus.FAILED);
                    booking.setCancellationReason("Tự động đánh dấu thất bại: Không đến đổi pin trong thời gian quy định");
                    bookingRepository.save(booking);
                    failedCount++;

                    log.warn("Đã đánh dấu FAILED cho booking #{} - User: {} - Ngày: {} - Giờ: {}",
                            booking.getBookingId(),
                            booking.getUser().getUserId(),
                            booking.getBookingDate(),
                            booking.getTimeSlot());
                }
            }

            if (failedCount > 0) {
                log.info("Đã đánh dấu FAILED cho {} booking PENDINGSWAPPING quá hạn.", failedCount);
            } else {
                log.info("Không có booking PENDINGSWAPPING nào quá hạn.");
            }

        } catch (Exception e) {
            log.error("Lỗi khi tự động đánh dấu booking FAILED: {}", e.getMessage(), e);
        }
    }
}

