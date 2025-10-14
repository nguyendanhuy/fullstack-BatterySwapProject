package BatterySwapStation.dto;

import java.time.LocalDateTime;
import java.util.List;

public class InvoiceResponseDTO {
    private Long id;
    private LocalDateTime createdDate;
    private Double totalAmount;
    private List<BookingInfoDTO> bookings;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }
    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }
    public List<BookingInfoDTO> getBookings() { return bookings; }
    public void setBookings(List<BookingInfoDTO> bookings) { this.bookings = bookings; }
}

