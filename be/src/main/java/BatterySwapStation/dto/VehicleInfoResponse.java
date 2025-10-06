package BatterySwapStation.dto;

import lombok.Data;

@Data
public class VehicleInfoResponse {
    private int vehicleId;
    private String vehicleType;
    private String batteryType;
    private boolean active;
    private String vin;
    private String phone;
}
