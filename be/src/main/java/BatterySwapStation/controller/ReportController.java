package BatterySwapStation.controller;

import BatterySwapStation.dto.ApiResponse;
import BatterySwapStation.service.ReportExportService;
import BatterySwapStation.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

// thêm import cho thao tác file

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

    // MARK: hide binary endpoints from OpenAPI to avoid Swagger UI trying to render binary responses
    // Some versions of springdoc/swagger-ui may still include endpoints annotated only with Operation(hidden=true),
    // so adding @Hidden ensures they are excluded from the generated OpenAPI document.

    @Hidden
    @Operation(summary = "Xuất báo cáo (single) ra file Excel",
            responses = {
                    @io.swagger.v3.oas.annotations.responses.ApiResponse(
                            responseCode = "200",
                            description = "File Excel được tạo thành công",
                            content = @Content(
                                    mediaType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                    schema = @Schema(type = "string", format = "binary")
                            )
                    ),
                    @io.swagger.v3.oas.annotations.responses.ApiResponse(
                            responseCode = "500",
                            description = "Lỗi khi tạo báo cáo"
                    )
            } // don't rely solely on Operation.hidden here
    )
    @GetMapping(value = "/{id}/export", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    public ResponseEntity<byte[]> exportReport(@PathVariable Long id) {
        try {
            byte[] excelBytes = reportExportService.exportReportToExcel(id);

            // Lưu file vào ổ D: (thư mục D:\\batteryswap-exports) nếu environment chỉ định
            String filename = "report-" + id + ".xlsx";
            try {
                String env = System.getenv("EXPORT_BASE_DIR");
                if (env != null && !env.isBlank()) {
                    Path dir = Paths.get(env);
                    if (!Files.exists(dir)) Files.createDirectories(dir);
                    Path filePath = dir.resolve(filename);
                    Files.write(filePath, excelBytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
                    return ResponseEntity.ok()
                            .header("Content-Disposition", "attachment; filename=" + filename)
                            .header("X-Saved-Path", filePath.toAbsolutePath().toString())
                            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                            .body(excelBytes);
                }
            } catch (Exception ex) {
                log.warn("Could not save single report to configured dir: {}", ex.getMessage());
            }

            // fallback: stream trực tiếp
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=report-" + id + ".xlsx")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(excelBytes);

        } catch (Exception e) {
            log.error("Export report failed: {}", e.getMessage());
            return ResponseEntity.status(500)
                    .body(("Error exporting report: " + e.getMessage()).getBytes());
        }
    }

    @Hidden
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

    // -- Consolidated export flow: single JSON endpoint (/export) + streaming on mode=download

    @Operation(summary = "Xuất tất cả báo cáo: trả JSON (mặc định) / trả downloadUrl (mode=link) / stream file (mode=download)")
    @GetMapping(value = "/export")
    public ResponseEntity<?> exportAllReportsUnified(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false, defaultValue = "json") String mode
    ) {
        try {
            // mode=download -> trả về file nhị phân trực tiếp
            if ("download".equalsIgnoreCase(mode)) {
                byte[] excelBytes = reportExportService.exportAllReportsToExcel(startDate, endDate);
                String filename = String.format("reports_%s_to_%s.xlsx", startDate, endDate);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                        .body(excelBytes);
            }

            // mode=link -> trả về đường dẫn để client gọi /export/download
            String downloadEndpoint = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/api/reports/export/download")
                    .queryParam("startDate", startDate)
                    .queryParam("endDate", endDate)
                    .toUriString();

            // mode=json (mặc định): trả về một JSON gồm nhiều "sheet" - tên sheet -> dữ liệu
            if ("json".equalsIgnoreCase(mode) || mode == null || mode.isBlank()) {
                Map<String, Object> sheets = new LinkedHashMap<>();
                // Lấy các báo cáo hiện có từ service và map vào từng sheet
                sheets.put("stationPerformance", reportService.getStationPerformanceReport());
                sheets.put("revenue_hourly", reportService.getRevenueReport(startDate, endDate, true));
                sheets.put("revenue_daily", reportService.getRevenueReport(startDate, endDate, false));
                sheets.put("swap_hourly", reportService.getSwapReport(startDate, endDate, true));
                sheets.put("swap_daily", reportService.getSwapReport(startDate, endDate, false));
                sheets.put("summary", reportService.getSummary());
                sheets.put("stations_range", reportService.getStationReport((int) Math.max(1, java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate) + 1)) );

                Map<String, Object> payload = new LinkedHashMap<>();
                payload.put("generatedAt", LocalDateTime.now());
                payload.put("range", Map.of("start", startDate, "end", endDate));
                payload.put("sheets", sheets);
                payload.put("downloadUrl", downloadEndpoint);

                // Nếu ENV chỉ định thư mục lưu file, kèm savedPath
                try {
                    String env = System.getenv("EXPORT_BASE_DIR");
                    if (env != null && !env.isBlank()) {
                        byte[] excelBytes = reportExportService.exportAllReportsToExcel(startDate, endDate);
                        Path dir = Paths.get(env);
                        if (!Files.exists(dir)) Files.createDirectories(dir);
                        String filename = String.format("reports_%s_to_%s.xlsx", startDate, endDate);
                        Path filePath = dir.resolve(filename);
                        Files.write(filePath, excelBytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
                        payload.put("savedPath", filePath.toAbsolutePath().toString());
                    }
                } catch (Exception ex) {
                    log.debug("Skipping saving exported file to disk: {}", ex.getMessage());
                }

                return ResponseEntity.ok(payload);
            }

            // default: trả về link (mode=link)
            String savedPath = null;
            try {
                String env = System.getenv("EXPORT_BASE_DIR");
                if (env != null && !env.isBlank()) {
                    byte[] excelBytes = reportExportService.exportAllReportsToExcel(startDate, endDate);
                    Path dir = Paths.get(env);
                    if (!Files.exists(dir)) Files.createDirectories(dir);
                    String filename = String.format("reports_%s_to_%s.xlsx", startDate, endDate);
                    Path filePath = dir.resolve(filename);
                    Files.write(filePath, excelBytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
                    savedPath = filePath.toAbsolutePath().toString();
                }
            } catch (Exception ex) {
                log.debug("Skipping saving exported file to disk: {}", ex.getMessage());
            }

            if (savedPath != null) {
                return ResponseEntity.ok(Map.of(
                        "downloadUrl", downloadEndpoint,
                        "savedPath", savedPath
                ));
            }

            return ResponseEntity.ok(Map.of(
                    "downloadUrl", downloadEndpoint
            ));

        } catch (Exception e) {
            log.error("Export all reports (unified) failed: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Error exporting reports: " + e.getMessage()));
        }
    }

    // New: hidden streaming endpoint, separate path to avoid conflicts with static-resource handlers
    @Hidden
    @Operation(summary = "(Internal) Stream combined reports as an XLSX file")
    @GetMapping(value = "/export/download", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    public ResponseEntity<byte[]> exportAllReportsDownload(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        try {
            byte[] excelBytes = reportExportService.exportAllReportsToExcel(startDate, endDate);
            String filename = String.format("reports_%s_to_%s.xlsx", startDate, endDate);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(excelBytes);
        } catch (Exception e) {
            log.error("Export all reports (download) failed: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(("Error exporting reports: " + e.getMessage()).getBytes());
        }
    }

    /**
     * Tải file báo cáo đã xuất (stream file từ server). Serves files only from the resolved base directory(s).
     */
    @Operation(summary = "Tải file báo cáo đã xuất (stream file từ server)")
    @GetMapping(value = "/download/{filename}")
    public ResponseEntity<Resource> downloadReport(@PathVariable String filename) {
        Path base = chooseBaseDir();
        try {
            Path file = base.resolve(filename);
            if (!Files.exists(file)) {
                // try also system tmp as fallback
                Path tmp = Paths.get(System.getProperty("java.io.tmpdir")).resolve(filename);
                if (Files.exists(tmp)) file = tmp;
            }
            if (!Files.exists(file)) {
                return ResponseEntity.notFound().build();
            }
            Resource resource = new UrlResource(file.toUri());
            String contentType = Files.probeContentType(file);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(resource);

        } catch (MalformedURLException e) {
            log.error("MalformedURLException when serving file {}: {}", filename, e.getMessage());
            return ResponseEntity.status(500).build();
        } catch (Exception e) {
            log.error("Failed to serve file {}: {}", filename, e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    // Helper: choose base dir (ENV EXPORT_BASE_DIR > D:\\batteryswap-exports > system tmp)
    private Path chooseBaseDir() {
        try {
            String env = System.getenv("EXPORT_BASE_DIR");
            if (env != null && !env.isBlank()) {
                return Paths.get(env);
            }
        } catch (Exception ignored) {
        }
        // prefer D:\\batteryswap-exports on local Windows dev if writable
        try {
            Path preferred = Paths.get("D:", "batteryswap-exports");
            if (Files.exists(preferred) || (preferred.toFile().getParentFile() != null && preferred.toFile().getParentFile().canWrite())) {
                return preferred;
            }
        } catch (Exception ignored) {
        }
        // fallback to system temp
        return Paths.get(System.getProperty("java.io.tmpdir"));
    }

    private Path saveBytesToFile(byte[] bytes, String filename) throws Exception {
        Path base = chooseBaseDir();
        if (!Files.exists(base)) {
            Files.createDirectories(base);
        }
        Path filePath = base.resolve(filename);
        Files.write(filePath, bytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        return filePath;
    }
}
