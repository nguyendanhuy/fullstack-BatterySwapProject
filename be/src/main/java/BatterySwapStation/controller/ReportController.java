//package BatterySwapStation.controller;
//
//import BatterySwapStation.dto.ApiResponseDto;
//import BatterySwapStation.service.ReportService;
//import lombok.RequiredArgsConstructor;
//import org.springframework.format.annotation.DateTimeFormat;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//import java.time.LocalDate;
//
//@RestController
//@RequestMapping("/api/reports")
//@RequiredArgsConstructor
//public class ReportController {
//
//    private final ReportService reportService;
//
//    // KPI theo trạm
//    @GetMapping("/station/performance")
//    public ResponseEntity<ApiResponseDto> getStationPerformanceReport() {
//        var report = reportService.getStationPerformanceReport();
//        return ResponseEntity.ok(new ApiResponseDto(true,
//                "Station performance report generated successfully", report));
//    }
//
//    // Doanh thu theo ngày
//    @GetMapping("/revenue/daily")
//    public ResponseEntity<ApiResponseDto> getDailyRevenueReport(
//            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
//            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
//    ) {
//        var report = reportService.getDailyRevenueReport(startDate, endDate);
//        return ResponseEntity.ok(new ApiResponseDto(true,
//                "Daily revenue report generated successfully", report));
//    }
//
//    // Lượt swap theo ngày
//    @GetMapping("/swap/daily")
//    public ResponseEntity<ApiResponseDto> getDailySwapReport(
//            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
//            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
//    ) {
//        var report = reportService.getDailySwapReport(startDate, endDate);
//        return ResponseEntity.ok(new ApiResponseDto(true,
//                "Daily swap report generated successfully", report));
//    }
//}
