package BatterySwapStation.dto;

import lombok.Data;

@Data
public class TicketUpdateRequest {
    private String newDescription;
    private String newStatus;
    private String newReason;
}