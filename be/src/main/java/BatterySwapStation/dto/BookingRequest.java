package BatterySwapStation.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

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

    private List<BatteryItemRequest> batteryItems;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatteryItemRequest {
        private String batteryType;
        private Integer quantity;
    }

}
