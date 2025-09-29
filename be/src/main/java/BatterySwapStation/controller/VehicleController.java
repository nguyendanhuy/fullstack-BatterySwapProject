package BatterySwapStation.controller;

import BatterySwapStation.dto.VehicleRegistrationRequest;
import BatterySwapStation.entity.Vehicle;
import BatterySwapStation.service.VehicleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vehicles")
@RequiredArgsConstructor
@Tag(name = "Vehicle", description = "Vehicle management APIs")
@CrossOrigin
public class VehicleController {
    private final VehicleService vehicleService;

    @PostMapping("/register")
    @Operation(summary = "Register a new VinFast vehicle")
    public ResponseEntity<Vehicle> registerVehicle(@Valid @RequestBody VehicleRegistrationRequest request) {
        String userId = "USER001"; // Tạm thời sử dụng userId cố định để test
        Vehicle vehicle = vehicleService.registerVehicle(userId, request);
        return ResponseEntity.ok(vehicle);
    }

    @GetMapping("/my-vehicles")
    @Operation(summary = "Get all vehicles registered by the current user")
    public ResponseEntity<List<Vehicle>> getUserVehicles() {
        String userId = "USER001"; // Tạm thời sử dụng userId cố định để test
        List<Vehicle> vehicles = vehicleService.getUserVehicles(userId);
        return ResponseEntity.ok(vehicles);
    }

    @PutMapping("/{vehicleId}/deactivate")
    @Operation(summary = "Deactivate a registered vehicle")
    public ResponseEntity<Void> deactivateVehicle(@PathVariable int vehicleId) {
        String userId = "USER001"; // Tạm thời sử dụng userId cố định để test
        vehicleService.deactivateVehicle(vehicleId, userId);
        return ResponseEntity.ok().build();
    }
}
