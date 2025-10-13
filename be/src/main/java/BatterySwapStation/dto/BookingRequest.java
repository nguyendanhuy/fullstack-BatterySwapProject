package BatterySwapStation.dto;

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
public class BookingRequest {
    private String userId;
    private Integer stationId;
    private Integer vehicleId;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate bookingDate;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime timeSlot;

    private List<BatteryItemRequest> batteryItems;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatteryItemRequest {
        private String batteryType;
        private Integer quantity;
    }
}
