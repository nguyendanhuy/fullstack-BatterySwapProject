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

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ReportId")
    private Long reportId;

    @Enumerated(EnumType.STRING)
    @Column(name = "ReportType", nullable = false, length = 50)
    private ReportType reportType;

    @Column(name = "StartDate")
    private LocalDateTime startDate;

    @Column(name = "EndDate")
    private LocalDateTime endDate;

    @Column(name = "GeneratedAt", nullable = false)
    private LocalDateTime generatedAt = LocalDateTime.now();

    @Lob
    @Column(name = "SummaryData", columnDefinition = "TEXT")
    private String summaryData; // JSON summary (tổng doanh thu, lượt swap, hiệu suất...)

    @Lob
    @Column(name = "DetailedData", columnDefinition = "TEXT")
    private String detailedData; // JSON raw data (chi tiết từng trạm, từng ngày,...)

    @Column(name = "GeneratedBy", length = 100)
    private String generatedBy; // optional: user email hoặc adminId

    public enum ReportType {
        STATION_PERFORMANCE,
        DAILY_REVENUE,
        HOURLY_REVENUE,
        DAILY_SWAP,
        HOURLY_SWAP,
        SUMMARY
    }

}
