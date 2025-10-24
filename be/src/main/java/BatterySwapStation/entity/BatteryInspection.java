package BatterySwapStation.entity;

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
public class BatteryInspection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Liên kết với booking
    // ✅ [SỬA LỖI]
    // Một Booking có thể có NHIỀU Inspection (Mỗi pin 1 cái)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bookingid", referencedColumnName = "bookingid")
    private Booking booking;

    // Pin nào đã được trả về?
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batteryid")
    private Battery battery;

    // Staff nào đã kiểm tra?
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staffid", referencedColumnName = "userid")
    private User staff;

    @Column(name = "inspectiontime")
    private LocalDateTime inspectionTime;

    @Column(name = "stateofhealth")
    private Double stateOfHealth; // (Yêu cầu 1: Sức khỏe pin)

    @Column(name = "physicalnotes", length = 500)
    private String physicalNotes; // (Yêu cầu 2: Ghi chú trầy, móp)

    @Column(name = "isdamaged", nullable = false)
    private boolean isDamaged = false; // Cờ (flag)
}