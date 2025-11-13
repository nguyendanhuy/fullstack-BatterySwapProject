package BatterySwapStation.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "VehicleBattery")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleBattery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "VehicleBatteryId")
    private Long id;

    // ============================
    // LIÊN KẾT XE
    // ============================
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VehicleId", nullable = false)
    @JsonBackReference
    private Vehicle vehicle;

    // ============================
    // LIÊN KẾT PIN
    // ============================
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "BatteryId", nullable = false)
    private Battery battery;

    // ============================
    // QUẢN LÝ TRẠNG THÁI GẮN / THÁO
    // ============================

    @Column(name = "AttachTime", nullable = false)
    private LocalDateTime attachTime;

    @Column(name = "DetachTime")
    private LocalDateTime detachTime;

    // true = pin đang gắn trên xe (active), false = đã tháo
    @Column(name = "IsActive", nullable = false)
    private boolean isActive;

    // true = pin chính (nếu xe dùng pin đôi)
    @Column(name = "IsPrimary", nullable = false)
    private boolean isPrimary;

    // Lý do tháo pin (option)
    @Column(name = "DetachReason", length = 200)
    private String detachReason;

}
