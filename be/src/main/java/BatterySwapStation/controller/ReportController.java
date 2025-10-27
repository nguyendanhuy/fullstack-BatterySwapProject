package BatterySwapStation.controller;

import BatterySwapStation.dto.ApiResponseDto;
import BatterySwapStation.service.ReportExportService;
import BatterySwapStation.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;

@Slf4j
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final ReportExportService reportExportService;

    @GetMapping("/station/performance")
    public ResponseEntity<ApiResponseDto> getStationPerformance() {
        return ResponseEntity.ok(new ApiResponseDto(true, "OK", reportService.getStationPerformanceReport()));
    }

    @GetMapping("/revenue/hourly")
    public ResponseEntity<ApiResponseDto> getRevenueHourly(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(new ApiResponseDto(true, "OK",
                reportService.getRevenueReport(startDate, endDate, true)));
    }

    @GetMapping("/revenue/daily")
    public ResponseEntity<ApiResponseDto> getRevenueDaily(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(new ApiResponseDto(true, "OK",
                reportService.getRevenueReport(startDate, endDate, false)));
    }

    @GetMapping("/swap/hourly")
    public ResponseEntity<ApiResponseDto> getSwapHourly(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(new ApiResponseDto(true, "OK",
                reportService.getSwapReport(startDate, endDate, true)));
    }

    @GetMapping("/swap/daily")
    public ResponseEntity<ApiResponseDto> getSwapDaily(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(new ApiResponseDto(true, "OK",
                reportService.getSwapReport(startDate, endDate, false)));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponseDto> getSummary() {
        return ResponseEntity.ok(new ApiResponseDto(true, "OK",
                reportService.getSummary()));
    }

    @GetMapping("/{id}/export")
    public ResponseEntity<byte[]> exportReport(@PathVariable Long id) {
        try {
            byte[] excelBytes = reportExportService.exportReportToExcel(id);

            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=report-" + id + ".xlsx")
                    .contentType(org.springframework.http.MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(excelBytes);

        } catch (Exception e) {
            log.error("Export report failed: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(("Error exporting report: " + e.getMessage()).getBytes());
        }
    }
}
