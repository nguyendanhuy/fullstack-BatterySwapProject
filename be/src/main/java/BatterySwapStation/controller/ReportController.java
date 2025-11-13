package BatterySwapStation.controller;

import BatterySwapStation.dto.ApiResponse;
import BatterySwapStation.service.ReportExportService;
import BatterySwapStation.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.Map;

// thêm import cho thao tác file
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;

@Slf4j
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final ReportExportService reportExportService;

    @Operation (summary = "Báo cáo hiệu suất trạm trong ngày hôm nay")
    @GetMapping("/station/performance")
    public ResponseEntity<ApiResponse> getStationPerformance() {
        return ResponseEntity.ok(new ApiResponse(true, "OK", reportService.getStationPerformanceReport()));
    }

    @Operation (summary = "Báo cáo doanh thu hàng giờ trong khoảng thời gian")
    @GetMapping("/revenue/hourly")
    public ResponseEntity<ApiResponse> getRevenueHourly(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(new ApiResponse(true, "OK",
                reportService.getRevenueReport(startDate, endDate, true)));
    }

    @Operation (summary = "Báo cáo doanh thu hàng ngày trong khoảng thời gian")
    @GetMapping("/revenue/daily")
    public ResponseEntity<ApiResponse> getRevenueDaily(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(new ApiResponse(true, "OK",
                reportService.getRevenueReport(startDate, endDate, false)));
    }

    @Operation (summary = "Báo cáo số lần đổi pin hàng giờ trong khoảng thời gian")
    @GetMapping("/swap/hourly")
    public ResponseEntity<ApiResponse> getSwapHourly(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(new ApiResponse(true, "OK",
                reportService.getSwapReport(startDate, endDate, true)));
    }


    @Operation (summary = "Báo cáo số lần đổi pin hàng ngày trong khoảng thời gian")
    @GetMapping("/swap/daily")
    public ResponseEntity<ApiResponse> getSwapDaily(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(new ApiResponse(true, "OK",
                reportService.getSwapReport(startDate, endDate, false)));
    }

    @Operation (summary = "Báo cáo tổng hợp hiệu suất hoạt động của hệ thống")
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse> getSummary() {
        return ResponseEntity.ok(new ApiResponse(true, "OK",
                reportService.getSummary()));
    }


    @Operation (summary = "Xuất báo cáo ra file Excel")
    @GetMapping("/{id}/export")
    public ResponseEntity<byte[]> exportReport(@PathVariable Long id) {
        try {
            byte[] excelBytes = reportExportService.exportReportToExcel(id);

            // Lưu file vào ổ D: (thư mục D:\batteryswap-exports)
            String baseDir = "D:\\batteryswap-exports";
            try {
                Path dir = Paths.get(baseDir);
                if (!Files.exists(dir)) {
                    Files.createDirectories(dir);
                }
                String filename = "report-" + id + ".xlsx";
                Path filePath = dir.resolve(filename);
                Files.write(filePath, excelBytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

                // Trả về bytes như trước, kèm header chứa đường dẫn server-side nơi đã lưu
                return ResponseEntity.ok()
                        .header("Content-Disposition", "attachment; filename=" + filename)
                        .header("X-Saved-Path", filePath.toAbsolutePath().toString())
                        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                        .body(excelBytes);

            } catch (Exception e) {
                log.error("Failed to save exported report to D:, fallback to direct stream: {}", e.getMessage());
                // Nếu lưu không thành công, trả về file bytes như trước
                return ResponseEntity.ok()
                        .header("Content-Disposition", "attachment; filename=report-" + id + ".xlsx")
                        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                        .body(excelBytes);
            }

        } catch (Exception e) {
            log.error("Export report failed: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(("Error exporting report: " + e.getMessage()).getBytes());
        }
    }
    @Operation (summary = "Báo cáo hiệu suất trạm trong khoảng 7 ngày gần nhất")
    @GetMapping("/station/{stationId}/range")
    public ResponseEntity<ApiResponse> getStationReportInRange(
            @PathVariable Integer stationId,
            @RequestParam(defaultValue = "7") int days
    ) {
        return ResponseEntity.ok(
                new ApiResponse(true, "OK", reportService.getStationReportInRange(stationId, days))
        );
    }

    @Operation (summary = "Báo cáo tổng hợp hàng ngày của tất cả các trạm trong khoảng ngày gần nhất")
    @GetMapping("/stations")
    public ResponseEntity<?> getAllStationReports(
            @RequestParam(defaultValue = "7") int days
    ) {
        Map<String, Object> result = reportService.getStationReport(days);
        return ResponseEntity.ok(result);
    }


    @Operation (summary = "Báo cáo hàng ngày của một trạm theo ngày cụ thể")
    @GetMapping("/stations/{stationId}/day")
    public ResponseEntity<?> getStationDailyReport(
            @PathVariable Integer stationId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        Map<String, Object> result = reportService.getStationDailyReport(stationId, date);
        return ResponseEntity.ok(result);
    }

    // Thêm vào ReportController.java

    @Operation(summary = "Xuất tất cả báo cáo thành file Excel với nhiều sheet")
    @GetMapping("/export/all")
    public ResponseEntity<byte[]> exportAllReports(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        try {
            byte[] excelBytes = reportExportService.exportAllReportsToExcel(startDate, endDate);

            String filename = String.format("reports_%s_to_%s.xlsx", startDate, endDate);

            // Lưu file vào ổ D:
            String baseDir = "D:\\batteryswap-exports";
            try {
                Path dir = Paths.get(baseDir);
                if (!Files.exists(dir)) {
                    Files.createDirectories(dir);
                }
                Path filePath = dir.resolve(filename);
                Files.write(filePath, excelBytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

                return ResponseEntity.ok()
                        .header("Content-Disposition", "attachment; filename=" + filename)
                        .header("X-Saved-Path", filePath.toAbsolutePath().toString())
                        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                        .body(excelBytes);

            } catch (Exception e) {
                log.error("Failed to save exported reports to D:, fallback to direct stream: {}", e.getMessage(), e);
                return ResponseEntity.ok()
                        .header("Content-Disposition", "attachment; filename=" + filename)
                        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                        .body(excelBytes);
            }

        } catch (Exception e) {
            log.error("Export all reports failed: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(("Error exporting reports: " + e.getMessage()).getBytes());
        }
    }
}
