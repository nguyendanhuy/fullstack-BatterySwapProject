package BatterySwapStation.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingRequest {

    private String userId; // Thêm userId
    private Integer stationId;
    private Integer vehicleId;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate bookingDate;

    private String timeSlot; // Đổi từ LocalTime sang String để Swagger không sinh ra second/nano

    private String batteryType; // Loại pin lấy từ vehicle
    private Integer batteryCount; // Số pin muốn đổi (bị giới hạn theo Vehicle.batteryCount)

}
