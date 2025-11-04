package BatterySwapStation.dto;

import BatterySwapStation.dto.VehicleImportErrorDTO;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class VehicleImportResultDTO {
    private int totalRows;
    private int successCount;
    private int failureCount;
    private List<VehicleImportErrorDTO> errors;
}