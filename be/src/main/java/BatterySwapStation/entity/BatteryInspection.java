package BatterySwapStation.entity;

import com.fasterxml.jackson.annotation.JsonIgnore; // ✅ [THÊM IMPORT NÀY]
import com.fasterxml.jackson.annotation.JsonIgnoreProperties; // ✅ [THÊM IMPORT NÀY]
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "BatteryInspection")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"}) // ✅ [THÊM DÒNG NÀY]
public class BatteryInspection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Liên kết với booking
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bookingid", referencedColumnName = "bookingid")
    @JsonIgnore // ✅ [THÊM DÒNG NÀY]
    private Booking booking;

    // Pin nào đã được trả về?
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batteryid")
    @JsonIgnore // ✅ [THÊM DÒNG NÀY]
    private Battery battery;

    // Staff nào đã kiểm tra?
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staffid", referencedColumnName = "userid")
    @JsonIgnore // ✅ [THÊM DÒNG NÀY]
    private User staff;

    @Column(name = "inspectiontime")
    private LocalDateTime inspectionTime;

    @Column(name = "stateofhealth")
    private Double stateOfHealth; // (Yêu cầu 1: Sức khỏe pin)

    @Column(name = "physicalnotes", length = 500)
    private String physicalNotes; // (Yêu cầu 2: Ghi chú trầy, móp)

    @Column(name = "isdamaged", nullable = false)
    private boolean isDamaged = false; // Cờ (flag)


    public enum InspectionStatus {
        PASS, // đạt
        IN_MAINTENANCE // đang bảo trì
    }
    public enum DamageLevel {
        NONE, MINOR, MEDIUM, SEVERE
    }
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private InspectionStatus status;
}