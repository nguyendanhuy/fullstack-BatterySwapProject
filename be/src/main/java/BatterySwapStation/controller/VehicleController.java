package BatterySwapStation.controller;

import BatterySwapStation.dto.VehicleRegistrationRequest;
import BatterySwapStation.dto.ApiResponseDto;
import BatterySwapStation.entity.User; // <-- CẦN IMPORT ENTITY USER CỦA BẠN
import BatterySwapStation.entity.Vehicle;
import BatterySwapStation.service.VehicleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal; // <-- IMPORT MỚI
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
    // Thay thế Principal bằng @AuthenticationPrincipal User
    public ResponseEntity<Vehicle> registerVehicle(
            @Valid @RequestBody VehicleRegistrationRequest request,
            @AuthenticationPrincipal User user) { // <-- Lấy trực tiếp đối tượng User

        String userId = user.getUserId(); // <-- Dùng getter chuẩn của Entity User
        Vehicle vehicle = vehicleService.registerVehicle(userId, request);
        return ResponseEntity.ok(vehicle);
    }

    @GetMapping("/my-vehicles")
    @Operation(summary = "Get all vehicles registered by the current user")
    // Thay thế Principal bằng @AuthenticationPrincipal User
    public ResponseEntity<List<Vehicle>> getUserVehicles(@AuthenticationPrincipal User user) {
        String userId = user.getUserId(); // <-- Lấy trực tiếp userId
        List<Vehicle> vehicles = vehicleService.getUserVehicles(userId);
        return ResponseEntity.ok(vehicles);
    }

    @PutMapping("/{vehicleId}/deactivate")
    @Operation(summary = "Deactivate a registered vehicle, returns success message or error if already deactivated")
    // Thay thế Principal bằng @AuthenticationPrincipal User
    public ResponseEntity<ApiResponseDto> deactivateVehicle(
            @PathVariable int vehicleId,
            @AuthenticationPrincipal User user) {

        String userId = user.getUserId(); // <-- Lấy trực tiếp userId

        // 1. Gọi Service để thực hiện logic ngắt kết nối/deactivate
        vehicleService.deactivateVehicle(vehicleId, userId);

        // 2. Nếu service không ném ra exception nào (tức là thành công), trả về thông báo.
        ApiResponseDto response = new ApiResponseDto(true, "Ngắt kết nối phương tiện thành công.");
        return ResponseEntity.ok(response);
    }
}
