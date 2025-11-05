package BatterySwapStation.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class VehicleImportErrorDTO {
    private int row;
    private String VIN;
    private String licensePlate;
    private List<String> errors;
}