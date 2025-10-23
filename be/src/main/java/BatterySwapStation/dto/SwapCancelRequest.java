package BatterySwapStation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class SwapCancelRequest {

    @Schema(example = "146")
    private Long bookingId;

    @Schema(example = "PERMANENT")
    private String cancelType = "PERMANENT";
}

