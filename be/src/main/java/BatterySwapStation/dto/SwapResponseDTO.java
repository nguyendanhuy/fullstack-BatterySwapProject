package BatterySwapStation.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class SwapResponseDTO {
    private String customerName;
    private String batteryOutId;
    private String batteryInId;
    private String stationName;
    private String dockOutSlot;
    private String dockInSlot;
    private String vehicleType;
    private String batteryType;
    private LocalDateTime completedTime;
    private String message;
}
