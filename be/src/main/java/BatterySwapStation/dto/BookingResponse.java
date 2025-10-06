package BatterySwapStation.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;


// DTO response cho booking
@Data
@AllArgsConstructor
@NoArgsConstructor
public class BookingResponse {
    private int bookingId;
    private String userId;
    private int vehicleId;
    private String vehicleVin;
    private int stationId;
    private String stationName;
    private LocalDateTime bookingTime;
    private LocalDateTime scheduledTime;
    private String status;
    private LocalDateTime completedTime;
    private String cancellationReason;
    private String notes;
}