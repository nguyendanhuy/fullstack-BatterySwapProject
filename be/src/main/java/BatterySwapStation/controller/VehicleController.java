package BatterySwapStation.controller;

import BatterySwapStation.dto.*;
import BatterySwapStation.entity.User;
import BatterySwapStation.entity.Vehicle;
import BatterySwapStation.service.VehicleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@PreAuthorize("permitAll()")
@RequestMapping("/api/v1/vehicles")
@RequiredArgsConstructor
@Tag(name = "Vehicle", description = "Vehicle management APIs")
@CrossOrigin
public class VehicleController {

    private final VehicleService vehicleService;

    @GetMapping("/{vin}")
    @Operation(summary = "Lấy thông tin phương tiện theo VIN")
    public ResponseEntity<VehicleInfoResponse> getVehicleByVIN(@PathVariable("vin") String vin) {
        VehicleInfoResponse response = vehicleService.getVehicleInfoResponseByVin(vin);
        return ResponseEntity.ok(response);
    }


    @PostMapping("/assign")
    @Operation(summary = "Gán phương tiện cho người dùng hiện tại")
    public ResponseEntity<ApiResponse> assignVehicle(
            @Valid @RequestBody AssignVehicleRequest request,
            @AuthenticationPrincipal User user) {
        vehicleService.assignVehicleToUser(user.getUserId(), request.getVin());
        return ResponseEntity.ok(new ApiResponse(true, "Gán phương tiện thành công!"));
    }

    @PostMapping("/register")
    @Operation(summary = "Đăng ký phương tiện mới và gán cho người dùng hiện tại")
    public ResponseEntity<ApiResponse> registerNewVehicle(
            @Valid @RequestBody VehicleRegistrationRequest request,
            @AuthenticationPrincipal User user) {
        vehicleService.registerNewVehicle(user.getUserId(), request);
        return ResponseEntity.ok(new ApiResponse(true, "Đăng ký phương tiện thành công!"));
    }

    @GetMapping("/my-vehicles")
    public ResponseEntity<List<VehicleMyResponse>> getMyVehicles(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(vehicleService.getMyVehiclesResponse(user.getUserId()));
    }



    @PostMapping("/{vehicleId}/deactivate")
    @Operation(summary = "Hủy kích hoạt phương tiện")
    public ResponseEntity<ApiResponse> deactivateVehicle(
            @PathVariable int vehicleId,
            @AuthenticationPrincipal User user) {
        vehicleService.deactivateVehicle(vehicleId, user.getUserId());
        return ResponseEntity.ok(new ApiResponse(true, "Hủy kích hoạt phương tiện thành công!"));
    }

    @GetMapping("/unassigned")
    public ResponseEntity<List<VehicleSimpleResponse>> getUnassignedVehicles() {
        return ResponseEntity.ok(vehicleService.getUnassignedVehiclesSimple());
    }

}