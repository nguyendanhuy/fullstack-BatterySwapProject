package BatterySwapStation.controller;

import BatterySwapStation.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * API kiểm tra sai lệch dữ liệu tồn (Operational Inventory Management - mục 6).
 *
 * Ví dụ:
 *  GET /api/audit/data-discrepancy
 *  GET /api/audit/data-discrepancy?stationId=16
 *  GET /api/audit/data-discrepancy?stationId=16&pushRealtime=true
 */
@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;

    @GetMapping("/data-discrepancy")
    public ResponseEntity<?> checkDataDiscrepancy(
            @RequestParam(value = "stationId", required = false) Integer stationId,
            @RequestParam(value = "pushRealtime", required = false, defaultValue = "false") boolean pushRealtime
    ) {
        return ResponseEntity.ok(auditService.checkDataDiscrepancy(stationId, pushRealtime));
    }
}
