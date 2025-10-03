package BatterySwapStation.dto;

import BatterySwapStation.entity.Vehicle;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class VehicleRegistrationRequest {
    @NotBlank(message = "VIN (Vehicle Identification Number) is required")
    @Pattern(regexp = "^[A-HJ-NPR-Z0-9]{17}$", message = "Invalid VIN format")
    private String vin;

    private Vehicle.VehicleType vehicleType;

    private Vehicle.BatteryType batteryType;
}
