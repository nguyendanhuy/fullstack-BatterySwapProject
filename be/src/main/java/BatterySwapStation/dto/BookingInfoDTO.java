package BatterySwapStation.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public class BookingInfoDTO {
    private Long bookingId;
    private LocalDate bookingDate;
    private LocalTime timeSlot;
    // Thêm các trường khác nếu cần

    // Getters and setters
    public Long getBookingId() { return bookingId; }
    public void setBookingId(Long bookingId) { this.bookingId = bookingId; }
    public LocalDate getBookingDate() { return bookingDate; }
    public void setBookingDate(LocalDate bookingDate) { this.bookingDate = bookingDate; }
    public LocalTime getTimeSlot() { return timeSlot; }
    public void setTimeSlot(LocalTime timeSlot) { this.timeSlot = timeSlot; }
}
