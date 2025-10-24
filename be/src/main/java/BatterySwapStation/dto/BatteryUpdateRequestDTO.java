package BatterySwapStation.dto;

import lombok.Data;

@Data
public class BatteryUpdateRequestDTO {
    private String batteryStatus;   // AVAILABLE / CHARGING / WAITING_CHARGE / MAINTENANCE
    private Double stateOfHealth;   // 0.0 - 100.0
}
