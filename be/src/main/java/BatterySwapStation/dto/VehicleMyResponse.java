package BatterySwapStation.dto;

import lombok.Data;

import java.util.List;

@Data
public class VehicleMyResponse {
    private int vehicleId;
    private String vehicleType;
    private String batteryType;
    private String manufactureDate;
    private String purchaseDate;
    private String licensePlate;
    private String color;
    private int batteryCount;
    private String ownerName;
    private boolean active;
    private String vin;
    private String batteryIds;

}
