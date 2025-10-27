package BatterySwapStation.dto;

import lombok.Data;

@Data
public class CreateStaffRequest {
    private String name;
    private String email;
    private String password;
    private Integer stationId;
}
