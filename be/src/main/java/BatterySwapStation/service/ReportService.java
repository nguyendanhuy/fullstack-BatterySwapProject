package BatterySwapStation.service;

import BatterySwapStation.entity.Booking;
import BatterySwapStation.entity.Invoice;
import BatterySwapStation.entity.Report;
import BatterySwapStation.entity.Swap;
import BatterySwapStation.repository.InvoiceRepository;
import BatterySwapStation.repository.ReportRepository;
import BatterySwapStation.repository.StationRepository;
import BatterySwapStation.repository.SwapRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ReportService {

    private final ReportRepository reportRepository;
    private final ReportWriteService reportWriteService;
    private final SwapRepository swapRepository;
    private final InvoiceRepository invoiceRepository;
    private final StationRepository stationRepository;

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

    @Transactional(readOnly = true)
    public Map<String, Object> getStationDailyReport(Integer stationId, LocalDate date) {
        log.info("📊 Generating daily report for stationId={} on date={}", stationId, date);

        // 1️⃣ Lấy danh sách swap trong ngày
        List<Swap> swaps = swapRepository.findByStationAndDate(stationId, date);

        if (swaps.isEmpty()) {
            log.warn("⚠️ Không có giao dịch swap nào tại stationId={} trong ngày {}", stationId, date);
        }

        // 2️⃣ Gom nhóm theo booking
        Map<Long, List<Swap>> swapsByBooking = swaps.stream()
                .collect(Collectors.groupingBy(s -> s.getBooking().getBookingId()));

        List<Map<String, Object>> rows = new ArrayList<>();
        double totalRevenue = 0;

        for (Map.Entry<Long, List<Swap>> entry : swapsByBooking.entrySet()) {
            Long bookingId = entry.getKey();
            List<Swap> swapList = entry.getValue();

            // 3️⃣ Tìm invoice tương ứng
            Invoice invoice = invoiceRepository.findByBookingId(bookingId).orElse(null);
            double amount = (invoice != null) ? invoice.getTotalAmount() : 0;
            totalRevenue += amount;

            rows.add(Map.of(
                    "bookingId", bookingId,
                    "swapCount", swapList.size(),
                    "amount", amount
            ));
        }

        // 4️⃣ Lấy thông tin trạm
        var station = stationRepository.findById(stationId)
                .orElseThrow(() -> new EntityNotFoundException("Station not found"));

        // 5️⃣ Tạo summary giống format Excel (giữ lại định dạng cũ: hardcoded 100%)
        Map<String, Object> summary = Map.of(
                "stationId", station.getStationId(),
                "stationName", station.getStationName(),
                "address", station.getAddress(),
                "reportDate", date,
                "totalBookings", rows.size(),
                "totalSwaps", swaps.size(),
                "totalRevenue", totalRevenue,
                "efficiencyRate", "100%"
        );

        // 6️⃣ Tổng hợp dữ liệu báo cáo
        Map<String, Object> data = Map.of(
                "summary", summary,
                "rows", rows
        );

        // 7️⃣ Ghi log & lưu report
        reportWriteService.saveReport(
                Report.ReportType.STATION_DETAIL,
                date, date,
                data
        );

        log.info("✅ Station daily report generated successfully for station={} ({} bookings, {} swaps)",
                station.getStationName(), rows.size(), swaps.size());

        return data;
    }

    // 📊 Lấy báo cáo 1 trạm theo khoảng ngày
    public Map<String, Object> getStationReportInRange(Integer stationId, int days) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(days);

        var swapRows = swapRepository.fetchDailySwapByStation(stationId, start, end);
        var revenueRows = invoiceRepository.fetchDailyRevenueByStation(stationId, start, end);

        int totalSwaps = swapRows.stream()
                .mapToInt(r -> ((Number) r.get("swapCount")).intValue())
                .sum();

        double totalRevenue = revenueRows.stream()
                .mapToDouble(r -> ((Number) r.get("totalRevenue")).doubleValue())
                .sum();

        var station = stationRepository.findById(stationId)
                .orElseThrow(() -> new EntityNotFoundException("Station not found"));

        // ✅ Lấy chi tiết các giao dịch (transactions)
        List<Map<String, Object>> transactions = getStationTransactionDetails(stationId, start, end);

        return Map.of(
                "stationId", stationId,
                "stationName", station.getStationName(),
                "address", station.getAddress(),
                "range", Map.of("start", start, "end", end, "days", days),
                "totalRevenue", totalRevenue,
                "totalSwaps", totalSwaps,
                "revenueChart", revenueRows,
                "swapChart", swapRows,
                "transactions", transactions
        );
    }

    // 📋 Lấy chi tiết các giao dịch của trạm
    private List<Map<String, Object>> getStationTransactionDetails(Integer stationId, LocalDate start, LocalDate end) {
        // Lấy tất cả swap trong khoảng thời gian
        List<Swap> swaps = swapRepository.findAllByStationIdAndDateRange(stationId, start, end);

        // Gom nhóm theo booking
        Map<Long, List<Swap>> swapsByBooking = swaps.stream()
                .collect(Collectors.groupingBy(s -> s.getBooking().getBookingId()));

        List<Map<String, Object>> transactions = new ArrayList<>();
        java.time.format.DateTimeFormatter timeFormatter = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        for (Map.Entry<Long, List<Swap>> entry : swapsByBooking.entrySet()) {
            Long bookingId = entry.getKey();
            List<Swap> swapList = entry.getValue();

            if (swapList.isEmpty()) continue;

            Swap firstSwap = swapList.getFirst();
            Booking booking = firstSwap.getBooking();

            // Lấy invoice
            Invoice invoice = invoiceRepository.findByBookingId(bookingId).orElse(null);

            // Lấy thời gian hoàn thành
            LocalDateTime completedDateTime = firstSwap.getCompletedTime();

            // Lấy thông tin xe & pin
            String vehicleModel = booking.getVehicle() != null
                    ? booking.getVehicle().getVehicleType().toString().replace("_", " ")
                    : "N/A";
            String batteryType = booking.getBatteryType() != null
                    ? booking.getBatteryType()
                    : "";

            // Lấy danh sách pin đã đổi
            String batteryIds = swapList.stream()
                    .map(s -> s.getBatteryOutId() != null ? s.getBatteryOutId() : "")
                    .filter(id -> !id.isEmpty())
                    .distinct()
                    .collect(Collectors.joining(", "));

            String vehicleAndBattery = String.format("%s %s", vehicleModel, batteryType).trim();
            if (!batteryIds.isEmpty()) {
                vehicleAndBattery += "\n" + batteryIds;
            }

            // Xác định phương thức thanh toán
            String paymentMethod = "Chuyển khoản";
            if (invoice != null) {
                if (booking.getTotalPrice() != null && booking.getTotalPrice() == 0) {
                    paymentMethod = "Thẻ tín dụng";
                } else if (invoice.getTotalAmount() <= booking.getAmount()) {
                    paymentMethod = "Ví điện tử";
                }
            }

            // Chuyển trạng thái sang tiếng Việt
            String statusVN = switch (booking.getBookingStatus()) {
                case COMPLETED -> "Hoàn thành";
                case PENDINGSWAPPING -> "Đang xử lý";
                case CANCELLED -> "Đã hủy";
                case PENDINGPAYMENT -> "Chờ thanh toán";
                case FAILED -> "Thất bại";
            };

            // Format số tiền
            String amountStr = invoice != null
                    ? String.format("%d VNĐ", invoice.getTotalAmount().intValue())
                    : "0 VNĐ";

            transactions.add(Map.of(
                    "transactionId", "TXN" + String.format("%04d", bookingId),
                    "customerName", booking.getUser().getFullName(),
                    "vehicleAndBattery", vehicleAndBattery,
                    "time", completedDateTime.format(timeFormatter),
                    "amount", amountStr,
                    "paymentMethod", paymentMethod,
                    "status", statusVN
            ));
        }

        // Sắp xếp theo thời gian giảm dần
        transactions.sort((a, b) -> {
            String timeA = (String) a.get("time");
            String timeB = (String) b.get("time");
            return timeB.compareTo(timeA);
        });

        return transactions;
    }

    // 📊 Lấy báo cáo tất cả trạm
    public Map<String, Object> getStationReport(int days) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(days);

        var stations = stationRepository.findAll();
        var swapData = swapRepository.fetchDailySwapByAllStations(start, end);
        var revenueData = invoiceRepository.fetchDailyRevenueByAllStations(start, end);

        List<Map<String, Object>> result = new ArrayList<>();

        for (var st : stations) {
            int id = st.getStationId();

            var revenueChart = revenueData.stream()
                    .filter(r -> ((Integer) r.get("stationId")) == id)
                    .toList();

            var swapChart = swapData.stream()
                    .filter(r -> ((Integer) r.get("stationId")) == id)
                    .toList();

            double totalRevenue = revenueChart.stream()
                    .mapToDouble(r -> ((Number) r.get("totalRevenue")).doubleValue())
                    .sum();

            int totalSwaps = swapChart.stream()
                    .mapToInt(r -> ((Number) r.get("swapCount")).intValue())
                    .sum();

            result.add(Map.of(
                    "stationId", id,
                    "stationName", st.getStationName(),
                    "address", st.getAddress(),
                    "range", Map.of("start", start, "end", end, "days", days),
                    "totalRevenue", totalRevenue,
                    "totalSwaps", totalSwaps,
                    "revenueChart", revenueChart,
                    "swapChart", swapChart
            ));
        }

        return Map.of("stations", result);
    }

}
