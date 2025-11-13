package BatterySwapStation.dto;

import lombok.Data;

@Data
public class VehicleSimpleResponse {
    private int vehicleId;
    private String VIN;
    private String vehicleType;
    private String batteryType;
    private int batteryCount;
    private String ownerName;
    private String color;
    private String licensePlate;
    private boolean isActive;
}
