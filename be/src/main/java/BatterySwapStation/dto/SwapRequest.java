package BatterySwapStation.dto;

import lombok.Data;

import java.util.List;

@Data
public class SwapRequest {
    private Long bookingId;
    private List<String> batteryInIds;
    private String staffUserId;  // Nhân viên thực hiện
}
