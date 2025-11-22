package BatterySwapStation.service;

import BatterySwapStation.entity.Report;
import BatterySwapStation.repository.ReportRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportWriteService {

    private final ReportRepository reportRepository;
    // Use the ObjectMapper provided by Spring (it has JavaTimeModule registered by default)
    private final ObjectMapper objectMapper;

    // A dedicated mapper for report serialization to guarantee JavaTime handling
    private ObjectMapper reportMapper;

    // Ensure ObjectMapper can handle Java 8 date/time types in case app's mapper isn't pre-configured
    @PostConstruct
    public void initMapper() {
        try {
            // create a safe copy so we don't modify global mapper unexpectedly
            reportMapper = objectMapper.copy();
            // register JavaTimeModule and prefer ISO string dates instead of timestamps
            reportMapper.registerModule(new JavaTimeModule());
            reportMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
            log.debug("ReportWriteService: reportMapper JavaTimeModule registered.");
        } catch (Exception e) {
            log.warn("ReportWriteService: Failed to configure reportMapper JavaTimeModule: {}", e.getMessage());
            // fallback to injected mapper if copy fails
            reportMapper = objectMapper;
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void saveReport(Report.ReportType type, LocalDate start, LocalDate end, Map<String, Object> data) {
        try {
            // use dedicated reportMapper to serialize (guaranteed to handle LocalDate/LocalDateTime)
            String json = reportMapper.writeValueAsString(data);
            String summaryJson = data.containsKey("summary")
                    ? reportMapper.writeValueAsString(data.get("summary"))
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
