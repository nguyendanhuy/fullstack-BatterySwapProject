package BatterySwapStation.service;

import BatterySwapStation.entity.Report;
import BatterySwapStation.repository.ReportRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportWriteService {

    private final ReportRepository reportRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveReport(Report.ReportType type, LocalDate start, LocalDate end, Map<String, Object> data) {
        try {
            String json = objectMapper.writeValueAsString(data);
            String summaryJson = data.containsKey("summary")
                    ? objectMapper.writeValueAsString(data.get("summary"))
                    : null;

            Report report = Report.builder()
                    .reportType(type)
                    .startDate(start != null ? start.atStartOfDay() : null)
                    .endDate(end != null ? end.atStartOfDay() : null)
                    .summaryData(summaryJson)
                    .detailedData(json)
                    .generatedAt(LocalDateTime.now())
                    .generatedBy("system")
                    .build();

            reportRepository.save(report);
            log.info("Report [{}] saved successfully at {}", type, report.getGeneratedAt());

        } catch (Exception e) {
            log.error("Failed to save report [{}]: {}", type, e.getMessage(), e);
        }
    }
}
