package BatterySwapStation.controller;

import BatterySwapStation.dto.ApiResponseDto;
import BatterySwapStation.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

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
}
