package BatterySwapStation.controller;

import BatterySwapStation.dto.ApiResponseDto;
import BatterySwapStation.dto.AssignVehicleRequest;
import BatterySwapStation.dto.VehicleRegistrationRequest;
import BatterySwapStation.entity.User;
import BatterySwapStation.entity.Vehicle;
import BatterySwapStation.service.VehicleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vehicles")
@RequiredArgsConstructor
@Tag(name = "Vehicle", description = "Vehicle management APIs")
@CrossOrigin
public class VehicleController {

    private final VehicleService vehicleService;

    @GetMapping("/{vin}")
    @Operation(summary = "Get vehicle information by VIN")
    public ResponseEntity<Vehicle> getVehicleByVin(@PathVariable String vin) {
        Vehicle vehicle = vehicleService.getVehicleInfoByVin(vin);
        return ResponseEntity.ok(vehicle);
    }

    @PostMapping("/assign")
    @Operation(summary = "Assign an existing vehicle to the current user")
    public ResponseEntity<ApiResponseDto> assignVehicle(
            @Valid @RequestBody AssignVehicleRequest request,
            @AuthenticationPrincipal User user) {
        vehicleService.assignVehicleToUser(user.getUserId(), request.getVin());
        return ResponseEntity.ok(new ApiResponseDto(true, "Vehicle assigned successfully."));
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new vehicle and assign it to the current user")
    public ResponseEntity<ApiResponseDto> registerNewVehicle(
            @Valid @RequestBody VehicleRegistrationRequest request,
            @AuthenticationPrincipal User user) {
        vehicleService.registerNewVehicle(user.getUserId(), request);
        return ResponseEntity.ok(new ApiResponseDto(true, "Vehicle registered successfully."));
    }

    @GetMapping("/my-vehicles")
    @Operation(summary = "Get all active vehicles for the current user")
    public ResponseEntity<List<Vehicle>> getMyActiveVehicles(@AuthenticationPrincipal User user) {
        List<Vehicle> vehicles = vehicleService.getActiveUserVehicles(user.getUserId());
        return ResponseEntity.ok(vehicles);
    }

    @PostMapping("/{vehicleId}/deactivate")
    @Operation(summary = "Deactivate a vehicle belonging to the current user")
    public ResponseEntity<ApiResponseDto> deactivateVehicle(
            @PathVariable int vehicleId,
            @AuthenticationPrincipal User user) {
        vehicleService.deactivateVehicle(vehicleId, user.getUserId());
        return ResponseEntity.ok(new ApiResponseDto(true, "Vehicle deactivated successfully."));
    }
}