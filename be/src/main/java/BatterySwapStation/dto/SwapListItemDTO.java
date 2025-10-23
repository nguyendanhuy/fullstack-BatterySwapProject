package BatterySwapStation.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class SwapListItemDTO {
    Long swapId;
    Long bookingId;
    Integer stationId;

    String userId;
    String staffUserId;

    String batteryOutId;
    String batteryInId;

    String dockOutSlot;
    String dockInSlot;

    String status;          // SUCCESS, CANCELLED
    LocalDateTime completedTime;
    String description;
}
