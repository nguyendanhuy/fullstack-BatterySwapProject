package BatterySwapStation.service;

import BatterySwapStation.entity.Report;
import BatterySwapStation.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ReportService {

    private final ReportRepository reportRepository;
    private final ReportWriteService reportWriteService;

    public List<Map<String, Object>> getStationPerformanceReport() {
        var result = reportRepository.fetchStationPerformance();
        reportWriteService.saveReport(Report.ReportType.STATION_PERFORMANCE, null, null, Map.of("rows", result));
        return result;
    }

    public Map<String, Object> getRevenueReport(LocalDate start, LocalDate end, boolean hourly) {
        var rows = hourly
                ? reportRepository.fetchHourlyRevenue(start, end)
                : reportRepository.fetchDailyRevenue(start, end);

        double total = rows.stream()
                .mapToDouble(r -> ((Number) r.get("totalRevenue")).doubleValue())
                .sum();

        Map<String, Object> summary = Map.of(
                "totalRevenue", total,
                "rowsCount", rows.size(),
                "range", Map.of("start", start, "end", end)
        );

        Map<String, Object> data = Map.of("summary", summary, "rows", rows);

        reportWriteService.saveReport(hourly
                ? Report.ReportType.HOURLY_REVENUE
                : Report.ReportType.DAILY_REVENUE, start, end, data);

        return data;
    }

    public Map<String, Object> getSwapReport(LocalDate start, LocalDate end, boolean hourly) {
        var rows = hourly
                ? reportRepository.fetchHourlySwap(start, end)
                : reportRepository.fetchDailySwap(start, end);

        int total = rows.stream()
                .mapToInt(r -> ((Number) r.get("swapCount")).intValue())
                .sum();

        Map<String, Object> summary = Map.of(
                "totalSwaps", total,
                "rowsCount", rows.size(),
                "range", Map.of("start", start, "end", end)
        );

        Map<String, Object> data = Map.of("summary", summary, "rows", rows);

        reportWriteService.saveReport(hourly
                ? Report.ReportType.HOURLY_SWAP
                : Report.ReportType.DAILY_SWAP, start, end, data);

        return data;
    }

    public Map<String, Object> getSummary() {
        long totalReports = reportRepository.count();
        Map<String, Object> summary = Map.of(
                "totalReports", totalReports,
                "lastGenerated", LocalDateTime.now()
        );
        reportWriteService.saveReport(Report.ReportType.SUMMARY, null, null, Map.of("summary", summary));
        return summary;
    }
}

