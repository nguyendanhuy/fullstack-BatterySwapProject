package BatterySwapStation.dto;

import BatterySwapStation.entity.Booking;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {
    private Long bookingId;
    private String userId;
    private String userName;
    private Integer stationId;
    private String stationName;
    private String stationAddress;
    private Integer vehicleId;
    private String vehicleVin;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate bookingDate;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime timeSlot;

    private String bookingStatus;
    private List<BatteryItemResponse> batteryItems;
    private PaymentInfo payment;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatteryItemResponse {
        private String batteryType;
        private Integer quantity;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentInfo {
        private Long paymentId;
        private String paymentMethod;
        private Double amount;
        private String paymentStatus;
    }
}
