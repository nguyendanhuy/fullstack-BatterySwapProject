package BatterySwapStation.dto;

import lombok.Data;

@Data
public class InspectionUpdateRequest {
    private Double stateOfHealth;
    private String physicalNotes;
    private Boolean damaged;
    private String newStatus;
}