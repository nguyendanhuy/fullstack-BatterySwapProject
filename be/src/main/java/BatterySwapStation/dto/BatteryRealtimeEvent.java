package BatterySwapStation.dto;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BatteryRealtimeEvent {
    private Integer stationId;
    private String dockName;
    private Integer slotNumber;
    private String batteryId;
    private String batteryStatus;  // AVAILABLE, CHARGING, EMPTY, ...
    private Double stateOfHealth;
    private Double currentCapacity;
    private String action;         // INSERTED, REMOVED, STATUS_CHANGED , // EJECTED, INSERTED
    private String timestamp;
}


