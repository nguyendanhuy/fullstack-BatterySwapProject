package BatterySwapStation.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

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
    private String vehicleType;  // Loại xe
    private Double amount;        // Giá tiền booking

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate bookingDate;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime timeSlot;

    private String bookingStatus;
    private String message;        // Thêm trường message để hiển thị thông báo
    private PaymentInfo payment;

    // Số pin muốn đổi (theo yêu cầu mới)
    private Integer batteryCount;

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
