package BatterySwapStation.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StationStaffGroupDTO {
    private Integer stationId;
    private String stationName;
    private String address;
    private boolean isActive;
    private List<StaffListItemDTO> staffList;
}
