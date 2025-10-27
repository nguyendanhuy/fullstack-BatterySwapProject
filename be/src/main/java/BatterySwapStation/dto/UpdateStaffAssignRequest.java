package BatterySwapStation.dto;

import lombok.Data;

@Data
public class UpdateStaffAssignRequest {
    private Integer stationId;
    private Boolean active;
}
