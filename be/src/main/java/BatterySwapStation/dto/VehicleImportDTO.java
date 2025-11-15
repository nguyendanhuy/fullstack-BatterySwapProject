package BatterySwapStation.dto;

import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleImportDTO {
    private String VIN;
    private String vehicleType;
    private String batteryType;
    private String userId;
    private String ownerName;
    private String licensePlate;
    private String color;
    private Integer batteryCount;
    private String manufactureDate;
    private String purchaseDate;
    private Boolean isActive;

    // danh sách battery ids (chuỗi) nếu CSV có cột battery_ids
    @Builder.Default
    private List<String> batteryIds = new ArrayList<>();

    // Validation errors
    @Builder.Default
    private List<String> errors = new ArrayList<>();

    public boolean isValid() {
        return errors.isEmpty();
    }
}
