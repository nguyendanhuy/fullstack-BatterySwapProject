package BatterySwapStation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatteryUpdateResponseDTO {
    private String batteryId;
    private String batteryStatus;
    private Double stateOfHealth;
    private String message;
}
