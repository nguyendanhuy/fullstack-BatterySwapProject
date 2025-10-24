package BatterySwapStation.dto;

import BatterySwapStation.entity.Battery;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BatteryStatusUpdateRequest {
    @Schema (description = "ID của pin cần cập nhật", example = "BAT001")
    private String batteryId;

    @Schema (description = "Trạng thái mới của pin", example = "CHARGING")
    private Battery.BatteryStatus newStatus;
}
