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
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportExportService {

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
}
