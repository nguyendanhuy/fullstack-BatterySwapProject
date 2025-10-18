package BatterySwapStation.dto;

import lombok.Data;

@Data
public class SwapRequest {
    private Long bookingId;
    private String batteryInId;  // Pin khách đưa
    private String staffUserId;  // Nhân viên thực hiện
}
