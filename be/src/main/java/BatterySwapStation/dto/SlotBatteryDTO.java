package BatterySwapStation.dto;

import lombok.Data;

@Data
public class SlotBatteryDTO {
    private Integer slotId;
    private Integer slotNumber;
    private String slotCode;
    private String batteryId;
    private String batteryType;
    private String batteryStatus;
    private Double currentCapacity;
    private Double stateOfHealth;
}