package BatterySwapStation.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SwapResponseDTO {
    private Long swapId;
    private String status;
    private String message;
    private Long bookingId;
    private String batteryOutId;
    private String batteryInId;
    private String dockOutSlot;
    private String dockInSlot;
}
