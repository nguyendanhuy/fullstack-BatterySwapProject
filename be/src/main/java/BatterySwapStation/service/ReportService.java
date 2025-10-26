//package BatterySwapStation.service;
//
//import BatterySwapStation.repository.ReportRepository;
//import lombok.RequiredArgsConstructor;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.time.LocalDate;
//import java.util.HashMap;
//import java.util.List;
//import java.util.Map;
//
//@Service
//@RequiredArgsConstructor
//@Transactional(readOnly = true)
//public class ReportService {
//
//    private final ReportRepository reportRepository;
//
//    // 1️⃣ KPI theo trạm
//    public List<Map<String, Object>> getStationPerformanceReport() {
//        return reportRepository.fetchStationPerformance();
//    }
//
//    // 2️⃣ Doanh thu theo ngày
//    public Map<String, Object> getDailyRevenueReport(LocalDate startDate, LocalDate endDate) {
//        List<Map<String, Object>> rows = reportRepository.fetchDailyRevenue(startDate, endDate);
//
//        double totalRevenue = rows.stream()
//                .mapToDouble(r -> ((Number) r.get("totalRevenue")).doubleValue())
//                .sum();
//        int totalTx = rows.stream()
//                .mapToInt(r -> ((Number) r.get("transactions")).intValue())
//                .sum();
//
//        Map<String, Object> summary = Map.of(
//                "totalRevenue", totalRevenue,
//                "totalTransactions", totalTx
//        );
//
//        Map<String, Object> result = new HashMap<>();
//        result.put("range", Map.of("start", startDate, "end", endDate));
//        result.put("rows", rows);
//        result.put("summary", summary);
//
//        return result;
//    }
//
//    // 3️⃣ Swap theo ngày
//    public Map<String, Object> getDailySwapReport(LocalDate startDate, LocalDate endDate) {
//        List<Map<String, Object>> rows = reportRepository.fetchDailySwaps(startDate, endDate);
//
//        int totalSwap = rows.stream()
//                .mapToInt(r -> ((Number) r.get("swapCount")).intValue())
//                .sum();
//        double totalRevenue = rows.stream()
//                .mapToDouble(r -> ((Number) r.get("revenue")).doubleValue())
//                .sum();
//
//        Map<String, Object> summary = Map.of(
//                "totalSwaps", totalSwap,
//                "totalRevenue", totalRevenue
//        );
//
//        Map<String, Object> result = new HashMap<>();
//        result.put("range", Map.of("start", startDate, "end", endDate));
//        result.put("rows", rows);
//        result.put("summary", summary);
//
//        return result;
//    }
//}
