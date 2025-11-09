package BatterySwapStation.dto;

import BatterySwapStation.entity.Battery;
import lombok.*;

/**
 * DTO dùng khi tạo lệnh điều phối mới (POST /api/rebalances)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RebalanceRequest {
    private Integer fromStationId;
    private Integer toStationId;
    private Battery.BatteryType batteryType;
    private int quantity;
    private String note;
}
