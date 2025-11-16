package BatterySwapStation.dto;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BatteryRealtimeEvent {
    private Integer stationId;
    private Integer dockId;
    private String dockName;
    private Integer slotNumber;
    private String batteryId;
    private String batteryStatus;  // AVAILABLE, CHARGING, EMPTY, ...
    private String batteryType;
    private Double stateOfHealth;
    private Double currentCapacity;
    private Integer cycleCount;

    private String action;         // INSERTED, REMOVED, STATUS_CHANGED , // EJECTED, INSERTED
    private String timestamp;
}


