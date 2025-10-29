package BatterySwapStation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class UpdateStaffAssignRequest {
    private Integer stationId;

    @Schema(hidden = true)
    private Boolean active = true;
}
