package BatterySwapStation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import java.util.List;

@Data
@Schema(description = "Kiem tra model pin")
public class BatteryModelCheckRequest {

    @Schema(description = "ID của booking cần kiểm tra", example = "146")
    private Long bookingId;

    @Schema(description = "Danh sách mã pin cần kiểm tra", example = "[\"BAT134\", \"BAT129\", \"BAT200\"]")
    private List<String> batteryIds;
}
