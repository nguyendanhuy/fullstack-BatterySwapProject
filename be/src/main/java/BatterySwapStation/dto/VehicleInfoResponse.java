package BatterySwapStation.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class VehicleInfoResponse {
    private int vehicleId;
    private String vin;
    private String ownerName;
    private String vehicleType;
    private String batteryType;
    private int batteryCount;
    private LocalDate purchaseDate;
    private int manufactureYear;
    private String color;
    private boolean active;
    private String licensePlate;
    private String userId;
    private String batteryIds;

}
