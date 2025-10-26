package BatterySwapStation.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "Report")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report {

    public enum ReportType {
        DAILY_REVENUE,
        HOURLY_REVENUE,
        DAILY_SWAP,
        HOURLY_SWAP,
        STATION_PERFORMANCE,
        SUMMARY,
        STATION_DETAIL
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "ReportType", nullable = false)
    private ReportType reportType;

    @Column(name = "StartDate")
    private LocalDateTime startDate;

    @Column(name = "EndDate")
    private LocalDateTime endDate;

    @Column(name = "GeneratedAt", nullable = false)
    private LocalDateTime generatedAt;

    @Column(name = "GeneratedBy", length = 100)
    private String generatedBy;

    @Lob
    @Column(name = "SummaryData", columnDefinition = "TEXT")
    private String summaryData;

    @Lob
    @Column(name = "DetailedData", columnDefinition = "TEXT")
    private String detailedData;

    // ✅ (tuỳ chọn) thêm hash để đảm bảo toàn vẹn
    @Column(name = "DataHash", length = 128)
    private String dataHash;
}
