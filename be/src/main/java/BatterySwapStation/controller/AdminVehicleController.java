package BatterySwapStation.controller;

import BatterySwapStation.dto.VehicleImportResultDTO;
import BatterySwapStation.service.VehicleImportService;
import BatterySwapStation.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/vehicles")
@RequiredArgsConstructor
public class AdminVehicleController {

    private final VehicleImportService vehicleImportService;
    private final VehicleService vehicleService;

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> importVehicles(
            @RequestPart("file") MultipartFile file) {

        try {
            VehicleImportResultDTO result = vehicleImportService.importVehiclesFromCSV(file);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "totalRows", result.getTotalRows(),
                "successCount", result.getSuccessCount(),
                "failureCount", result.getFailureCount(),
                "errors", result.getErrors()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllVehicles() {
        List<?> list = vehicleService.getAllVehiclesAdminUnpaged();
        return ResponseEntity.ok(Map.of(
            "success", true,
            "totalElements", list.size(),
            "vehicles", list
        ));
    }
}
