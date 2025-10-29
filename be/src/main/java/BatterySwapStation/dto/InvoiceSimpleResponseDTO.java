package BatterySwapStation.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceSimpleResponseDTO {

    private Long invoiceId;
    private String userId;
    private LocalDateTime createdDate;
    private Double totalAmount;
    private Double pricePerSwap;
    private Integer numberOfSwaps;
    private List<SimpleBookingInfo> bookings;
    private String invoiceStatus;
    private String invoiceType;
    private String paymentMethod;
    private SimplePlanInfo planToActivate;


    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SimpleBookingInfo {
        private Long bookingId;
        private LocalDate bookingDate;
        private LocalTime timeSlot;
        private String vehicleType;
        private Double amount;
        private String bookingStatus;

        // Chỉ thông tin cơ bản của station
        private Integer stationId;
        private String stationName;
        private String stationAddress;

        // Chỉ thông tin cơ bản của vehicle
        private Integer vehicleId;
        private String licensePlate;
        private String vehicleBatteryType;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SimplePlanInfo {
        private Long planId;
        private String planName;
        private String description;
        private Integer durationInDays;
        private String priceType;
        private Integer swapLimit;
    }
}
