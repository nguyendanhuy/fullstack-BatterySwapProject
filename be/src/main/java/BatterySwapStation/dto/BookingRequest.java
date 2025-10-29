package BatterySwapStation.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingRequest {

    private String userId;

    @NotNull(message = "StationId không được để trống")
    private Integer stationId;

    private Integer vehicleId;

    @NotNull(message = "Ngày đặt lịch không được để trống")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate bookingDate;

    @NotNull(message = "Khung giờ không được để trống")
    private String timeSlot;  // GIỮ LẠI STRING

    private String batteryType;
    private Integer batteryCount;

    @Size(max = 3, message = "Chỉ cho phép tối đa 3 xe")
    private List<Integer> vehicleIds;

    /**
     * Chỉ định phương thức thanh toán.
     * Người dùng phải gửi: "WALLET" hoặc "VNPAY"
     */
    private String paymentMethod;

    private String notes;

}