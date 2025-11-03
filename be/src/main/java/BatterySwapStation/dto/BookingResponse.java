package BatterySwapStation.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {

    // Thông tin booking cơ bản
    private Long bookingId;
    private String bookingStatus;
    private Double amount;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate bookingDate;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime timeSlot;

    // Thông tin user
    private String userId;
    private String userName;

    // Thông tin trạm
    private Integer stationId;
    private String stationName;
    private String stationAddress;

    // Thông tin xe
    private Integer vehicleId;
    private String vehicleVin;
    private String vehicleType;

    // Thông tin pin
    private Integer batteryCount;
    private String batteryType;

    // Thông tin bổ sung
    private String notes;
    private String cancellationReason;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate completedTime;

    // Thông tin hóa đơn
    private String invoiceId;

    // Message động cho batch booking
    private String message;

    // ✅ THÊM: Thông tin gói cước
    private Boolean isFreeSwap;              // Có phải booking miễn phí không
    private String subscriptionPlanName;      // Tên gói cước đang dùng
    private Integer usedSwaps;                // Số lượt đã sử dụng
    private Integer totalSwapLimit;           // Tổng số lượt của gói

    // Thông tin thanh toán (nested object)
    private PaymentInfo payment;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentInfo {
        private Long paymentId;
        private String paymentMethod;
        private Double amount;
        private String paymentStatus;

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime paymentDate;
    }
}