package BatterySwapStation.dto;

import java.time.LocalDate;
import java.util.List;

public class InvoiceResponseDTO {
    private Long id;
    private LocalDate createdDate;
    private Double totalAmount;
    private Double pricePerSwap;      // Giá mỗi lần đổi pin
    private Integer numberOfSwaps;    // Số lần đổi pin
    private List<BookingInfoDTO> bookings;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDate getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDate createdDate) { this.createdDate = createdDate; }
    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }
    public Double getPricePerSwap() { return pricePerSwap; }
    public void setPricePerSwap(Double pricePerSwap) { this.pricePerSwap = pricePerSwap; }
    public Integer getNumberOfSwaps() { return numberOfSwaps; }
    public void setNumberOfSwaps(Integer numberOfSwaps) { this.numberOfSwaps = numberOfSwaps; }
    public List<BookingInfoDTO> getBookings() { return bookings; }
    public void setBookings(List<BookingInfoDTO> bookings) { this.bookings = bookings; }
}
