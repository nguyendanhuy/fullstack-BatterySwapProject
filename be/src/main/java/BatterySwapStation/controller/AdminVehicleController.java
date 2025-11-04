package BatterySwapStation.controller;

            import BatterySwapStation.dto.VehicleImportResultDTO;
            import BatterySwapStation.service.VehicleImportService;
            import lombok.RequiredArgsConstructor;
            import org.springframework.http.HttpStatus;
            import org.springframework.http.MediaType;
            import org.springframework.http.ResponseEntity;
            import org.springframework.web.bind.annotation.*;
            import org.springframework.web.multipart.MultipartFile;

            import java.util.Map;

            @RestController
            @RequestMapping("/api/admin/vehicles")
            @RequiredArgsConstructor
            public class AdminVehicleController {

                private final VehicleImportService vehicleImportService;

                @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
                public ResponseEntity<Map<String, Object>> importVehicles(
                        @RequestPart(value = "file", required = true) MultipartFile file) {

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
            }