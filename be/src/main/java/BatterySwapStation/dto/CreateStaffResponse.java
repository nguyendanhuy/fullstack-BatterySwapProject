package BatterySwapStation.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateStaffResponse {
    private String staffId;
    private String fullName;
    private String email;
    private String role;
    private Integer stationId;
    private String stationName;
    private boolean active;
}
