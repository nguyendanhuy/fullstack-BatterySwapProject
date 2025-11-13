package BatterySwapStation.service;

import BatterySwapStation.entity.Report;
import BatterySwapStation.repository.ReportRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportExportService {

    private final ReportService reportService;
    private final ReportRepository reportRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public byte[] exportReportToExcel(Long reportId) throws Exception {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + reportId));

        // detailedData có dạng {"summary": {...}, "rows": [...]}
        Map<String, Object> data = objectMapper.readValue(
                report.getDetailedData(), new TypeReference<Map<String, Object>>() {}
        );

        // parse rows -> giữ LinkedHashMap để không mất thứ tự khi cần
        @SuppressWarnings("unchecked")
        List<LinkedHashMap<String, Object>> rows =
                (List<LinkedHashMap<String, Object>>) data.getOrDefault("rows", List.of());

        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Report Data");

            // ====== Styles ======
            DataFormat df = wb.createDataFormat();

            CellStyle headerStyle = wb.createCellStyle();
            Font bold = wb.createFont();
            bold.setBold(true);
            headerStyle.setFont(bold);
            headerStyle.setWrapText(true);
            headerStyle.setBorderBottom(BorderStyle.THIN);

            CellStyle intStyle = wb.createCellStyle();
            intStyle.setDataFormat(df.getFormat("0"));

            CellStyle moneyStyle = wb.createCellStyle();
            moneyStyle.setDataFormat(df.getFormat("#,##0"));

            CellStyle percentStyle = wb.createCellStyle();
            percentStyle.setDataFormat(df.getFormat("0.00%"));

            // ====== Header theo loại report ======
            List<String> headers = headersFor(report.getReportType(), rows);

            // Thông tin meta trên 2 dòng đầu (tuỳ chọn)
            int r = 0;
            Row meta1 = sheet.createRow(r++);
            meta1.createCell(0).setCellValue("Report Type");
            meta1.createCell(1).setCellValue(String.valueOf(report.getReportType()));

            Row meta2 = sheet.createRow(r++);
            meta2.createCell(0).setCellValue("Generated At");
            meta2.createCell(1).setCellValue(report.getGeneratedAt()
                    .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

            if (report.getStartDate() != null || report.getEndDate() != null) {
                Row meta3 = sheet.createRow(r++);
                meta3.createCell(0).setCellValue("Range");
                String range = String.format("%s ~ %s",
                        report.getStartDate() == null ? "" : report.getStartDate(),
                        report.getEndDate() == null ? "" : report.getEndDate());
                meta3.createCell(1).setCellValue(range);
            }

            // Dòng trống
            r++;

            // ====== Header row ======
            Row headerRow = sheet.createRow(r++);
            for (int c = 0; c < headers.size(); c++) {
                Cell cell = headerRow.createCell(c);
                cell.setCellValue(headers.get(c));
                cell.setCellStyle(headerStyle);
            }

            // ====== Data rows ======
            for (LinkedHashMap<String, Object> row : rows) {
                Row xRow = sheet.createRow(r++);
                for (int c = 0; c < headers.size(); c++) {
                    String key = headers.get(c);
                    Object v = row.get(key);
                    Cell cell = xRow.createCell(c);
                    setCellValue(cell, v, key, intStyle, moneyStyle, percentStyle);
                }
            }

            // autosize
            for (int c = 0; c < headers.size(); c++) {
                sheet.autoSizeColumn(c);
                // giới hạn width để tránh quá to
                int max = 100 * 256;
                if (sheet.getColumnWidth(c) > max) sheet.setColumnWidth(c, max);
            }

            try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                wb.write(out);
                return out.toByteArray();
            }
        }
    }

    /** Xác định danh sách cột theo loại report (thứ tự cố định → không bị lệch) */
    private List<String> headersFor(Report.ReportType type, List<LinkedHashMap<String, Object>> rows) {
        if (type == null) type = Report.ReportType.SUMMARY;

        switch (type) {
            case STATION_PERFORMANCE:
                return List.of(
                        "stationId", "stationName", "address",
                        "managedBatteries", "totalTransactions", "totalRevenue", "efficiencyRate"
                );
            case HOURLY_REVENUE:
                return List.of("date", "hour", "transactions", "totalRevenue");
            case DAILY_REVENUE:
                return List.of("date", "transactions", "totalRevenue");
            case HOURLY_SWAP:
                return List.of("date", "hour", "swapCount");
            case DAILY_SWAP:
                return List.of("date", "swapCount");
            case SUMMARY:
            default:
                // nếu không biết, lấy union key của tất cả rows theo thứ tự gặp đầu tiên
                LinkedHashSet<String> keys = new LinkedHashSet<>();
                for (Map<String, Object> r : rows) keys.addAll(r.keySet());
                return new ArrayList<>(keys);
        }
    }

    /** Gán giá trị + style theo key/kiểu dữ liệu (tránh E9, %…) */
    private void setCellValue(Cell cell, Object v, String key,
                              CellStyle intStyle, CellStyle moneyStyle, CellStyle percentStyle) {
        if (v == null) {
            cell.setCellValue("");
            return;
        }

        // ưu tiên số
        if (v instanceof Integer || v instanceof Long) {
            cell.setCellValue(((Number) v).doubleValue());
            cell.setCellStyle(intStyle);
            return;
        }
        if (v instanceof Float || v instanceof Double || v instanceof BigDecimal) {
            double d = (v instanceof BigDecimal) ? ((BigDecimal) v).doubleValue() : ((Number) v).doubleValue();

            // đoán style theo tên cột
            if (key.toLowerCase().contains("revenue") || key.toLowerCase().contains("amount")) {
                cell.setCellValue(d);
                cell.setCellStyle(moneyStyle);
            } else if (key.toLowerCase().contains("efficiency") || key.toLowerCase().contains("rate") || key.toLowerCase().contains("percent")) {
                // dữ liệu của bạn là 100.00 = 100% → convert về 1.0 để hiển thị 100%
                cell.setCellValue(d / 100.0);
                cell.setCellStyle(percentStyle);
            } else {
                cell.setCellValue(d);
            }
            return;
        }

        // còn lại coi như String
        cell.setCellValue(String.valueOf(v));
    }


    public byte[] exportAllReportsToExcel(LocalDate startDate, LocalDate endDate) throws IOException {
        Workbook workbook = new XSSFWorkbook();

        try {
            // Sheet 1: Báo cáo hiệu suất trạm hôm nay
            createStationPerformanceSheet(workbook);

            // Sheet 2: Báo cáo doanh thu hàng giờ
            createRevenueHourlySheet(workbook, startDate, endDate);

            // Sheet 3: Báo cáo doanh thu hàng ngày
            createRevenueDailySheet(workbook, startDate, endDate);

            // Sheet 4: Báo cáo đổi pin hàng giờ
            createSwapHourlySheet(workbook, startDate, endDate);

            // Sheet 5: Báo cáo đổi pin hàng ngày
            createSwapDailySheet(workbook, startDate, endDate);

            // Sheet 6: Báo cáo tổng hợp
            createSummarySheet(workbook);

            // Sheet 7: Báo cáo tất cả trạm
            createAllStationsSheet(workbook, 7);

            // Write to byte array
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();

        } finally {
            workbook.close();
        }
    }

    private void createStationPerformanceSheet(Workbook workbook) {
        Sheet sheet = workbook.createSheet("Hiệu suất trạm hôm nay");
        var data = reportService.getStationPerformanceReport();

        // Header
        Row headerRow = sheet.createRow(0);
        headerRow.createCell(0).setCellValue("ID Trạm");
        headerRow.createCell(1).setCellValue("Tên trạm");
        headerRow.createCell(2).setCellValue("Địa chỉ");
        headerRow.createCell(3).setCellValue("Số pin quản lý");
        headerRow.createCell(4).setCellValue("Số giao dịch");
        headerRow.createCell(5).setCellValue("Doanh thu");
        headerRow.createCell(6).setCellValue("Tỷ lệ sử dụng (%)");

        // create percent style
        CellStyle percentStyle = workbook.createCellStyle();
        DataFormat df = workbook.createDataFormat();
        percentStyle.setDataFormat(df.getFormat("0.00%"));

        if (data instanceof List) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> stations = (List<Map<String, Object>>) data;
            int rowNum = 1;
            for (Map<String, Object> st : stations) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(st.getOrDefault("stationId", "").toString());
                row.createCell(1).setCellValue(st.getOrDefault("stationName", "").toString());
                row.createCell(2).setCellValue(st.getOrDefault("address", "").toString());
                row.createCell(3).setCellValue(((Number) st.getOrDefault("managedBatteries", 0)).longValue());
                row.createCell(4).setCellValue(((Number) st.getOrDefault("totalTransactions", 0)).longValue());
                Object rev = st.getOrDefault("totalRevenue", 0);
                row.createCell(5).setCellValue(((Number) rev).doubleValue());

                // efficiencyRate is stored as 0..100 in DB/sql — convert to 0..1 for Excel percent format
                Object effObj = st.getOrDefault("efficiencyRate", 0);
                double effVal = 0.0;
                try {
                    effVal = (effObj instanceof Number) ? ((Number) effObj).doubleValue() : Double.parseDouble(String.valueOf(effObj));
                } catch (Exception ex) {
                    effVal = 0.0;
                }
                Cell effCell = row.createCell(6);
                effCell.setCellValue(effVal / 100.0);
                effCell.setCellStyle(percentStyle);
            }
        }

        // Auto-size columns
        for (int i = 0; i <= 6; i++) sheet.autoSizeColumn(i);
    }

    private void createRevenueHourlySheet(Workbook workbook, LocalDate startDate, LocalDate endDate) {
        Sheet sheet = workbook.createSheet("Doanh thu theo giờ");
        var data = reportService.getRevenueReport(startDate, endDate, true);

        Row headerRow = sheet.createRow(0);
        headerRow.createCell(0).setCellValue("Ngày");
        headerRow.createCell(1).setCellValue("Giờ");
        headerRow.createCell(2).setCellValue("Doanh thu");
        headerRow.createCell(3).setCellValue("Số giao dịch");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows = (List<Map<String, Object>>) ((Map<String, Object>) data).getOrDefault("rows", List.of());
        int r = 1;
        for (Map<String, Object> rec : rows) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(String.valueOf(rec.getOrDefault("date", "")));
            row.createCell(1).setCellValue(String.valueOf(rec.getOrDefault("hour", "")));
            Object rev = rec.getOrDefault("totalRevenue", 0);
            row.createCell(2).setCellValue(((Number) rev).doubleValue());
            row.createCell(3).setCellValue(((Number) rec.getOrDefault("transactions", 0)).longValue());
        }

        for (int i = 0; i < 4; i++) sheet.autoSizeColumn(i);
    }

    private void createRevenueDailySheet(Workbook workbook, LocalDate startDate, LocalDate endDate) {
        Sheet sheet = workbook.createSheet("Doanh thu theo ngày");
        var data = reportService.getRevenueReport(startDate, endDate, false);

        Row headerRow = sheet.createRow(0);
        headerRow.createCell(0).setCellValue("Ngày");
        headerRow.createCell(1).setCellValue("Doanh thu");
        headerRow.createCell(2).setCellValue("Số giao dịch");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows = (List<Map<String, Object>>) ((Map<String, Object>) data).getOrDefault("rows", List.of());
        int r = 1;
        for (Map<String, Object> rec : rows) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(String.valueOf(rec.getOrDefault("date", "")));
            Object rev = rec.getOrDefault("totalRevenue", 0);
            row.createCell(1).setCellValue(((Number) rev).doubleValue());
            row.createCell(2).setCellValue(((Number) rec.getOrDefault("transactions", 0)).longValue());
        }

        for (int i = 0; i < 3; i++) sheet.autoSizeColumn(i);
    }

    private void createSwapHourlySheet(Workbook workbook, LocalDate startDate, LocalDate endDate) {
        Sheet sheet = workbook.createSheet("Đổi pin theo giờ");
        var data = reportService.getSwapReport(startDate, endDate, true);

        Row headerRow = sheet.createRow(0);
        headerRow.createCell(0).setCellValue("Ngày");
        headerRow.createCell(1).setCellValue("Giờ");
        headerRow.createCell(2).setCellValue("Số lần đổi pin");
        headerRow.createCell(3).setCellValue("Trạm");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows = (List<Map<String, Object>>) ((Map<String, Object>) data).getOrDefault("rows", List.of());
        int r = 1;
        for (Map<String, Object> rec : rows) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(String.valueOf(rec.getOrDefault("date", "")));
            row.createCell(1).setCellValue(String.valueOf(rec.getOrDefault("hour", "")));
            row.createCell(2).setCellValue(((Number) rec.getOrDefault("swapCount", 0)).longValue());
            row.createCell(3).setCellValue(String.valueOf(rec.getOrDefault("stationId", "")));
        }

        for (int i = 0; i < 4; i++) sheet.autoSizeColumn(i);
    }

    private void createSwapDailySheet(Workbook workbook, LocalDate startDate, LocalDate endDate) {
        Sheet sheet = workbook.createSheet("Đổi pin theo ngày");
        var data = reportService.getSwapReport(startDate, endDate, false);

        Row headerRow = sheet.createRow(0);
        headerRow.createCell(0).setCellValue("Ngày");
        headerRow.createCell(1).setCellValue("Số lần đổi pin");
        headerRow.createCell(2).setCellValue("Trạm");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows = (List<Map<String, Object>>) ((Map<String, Object>) data).getOrDefault("rows", List.of());
        int r = 1;
        for (Map<String, Object> rec : rows) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(String.valueOf(rec.getOrDefault("date", "")));
            row.createCell(1).setCellValue(((Number) rec.getOrDefault("swapCount", 0)).longValue());
            row.createCell(2).setCellValue(String.valueOf(rec.getOrDefault("stationId", "")));
        }

        for (int i = 0; i < 3; i++) sheet.autoSizeColumn(i);
    }

    private void createSummarySheet(Workbook workbook) {
        Sheet sheet = workbook.createSheet("Tổng hợp");
        var data = reportService.getSummary();

        Row headerRow = sheet.createRow(0);
        headerRow.createCell(0).setCellValue("Chỉ số");
        headerRow.createCell(1).setCellValue("Giá trị");

        int r = 1;
        sheet.createRow(r++).createCell(0).setCellValue("totalReports");
        sheet.getRow(r-1).createCell(1).setCellValue(((Number) data.getOrDefault("totalReports", 0)).longValue());

        sheet.createRow(r++).createCell(0).setCellValue("lastGenerated");
        sheet.getRow(r-1).createCell(1).setCellValue(String.valueOf(data.getOrDefault("lastGenerated", "")));

        for (int i = 0; i < 2; i++) sheet.autoSizeColumn(i);
    }

    private void createAllStationsSheet(Workbook workbook, int days) {
        Sheet sheet = workbook.createSheet("Tất cả trạm");
        Map<String, Object> data = reportService.getStationReport(days);

        Row headerRow = sheet.createRow(0);
        headerRow.createCell(0).setCellValue("ID Trạm");
        headerRow.createCell(1).setCellValue("Tên trạm");
        headerRow.createCell(2).setCellValue("Range Start");
        headerRow.createCell(3).setCellValue("Range End");
        headerRow.createCell(4).setCellValue("Số lần đổi pin");
        headerRow.createCell(5).setCellValue("Doanh thu");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> stations = (List<Map<String, Object>>) data.getOrDefault("stations", List.of());
        int r = 1;
        for (Map<String, Object> st : stations) {
            Row row = sheet.createRow(r++);
            row.createCell(0).setCellValue(String.valueOf(st.getOrDefault("stationId", "")));
            row.createCell(1).setCellValue(String.valueOf(st.getOrDefault("stationName", "")));

            Object range = st.getOrDefault("range", Map.of());
            if (range instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> rg = (Map<String, Object>) range;
                row.createCell(2).setCellValue(String.valueOf(rg.getOrDefault("start", "")));
                row.createCell(3).setCellValue(String.valueOf(rg.getOrDefault("end", "")));
            } else {
                row.createCell(2).setCellValue("");
                row.createCell(3).setCellValue("");
            }

            row.createCell(4).setCellValue(((Number) st.getOrDefault("totalSwaps", 0)).longValue());
            row.createCell(5).setCellValue(((Number) st.getOrDefault("totalRevenue", 0)).doubleValue());
        }

        for (int i = 0; i <= 5; i++) sheet.autoSizeColumn(i);
    }

    // Style helper method
    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

}
