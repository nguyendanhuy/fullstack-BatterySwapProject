package BatterySwapStation.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "Vehicle")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "VehicleId", nullable = false)
    private int vehicleId;

    @ManyToOne
    @JoinColumn(name = "UserId", nullable = false, columnDefinition = "VARCHAR(20)")
    private User user;

    @Column(nullable = false, length = 100)
    private String VIN;

    public enum VehicleType {
        // Xe máy điện
        THEON,          // VinFast Theon
        FELIZ,          // VinFast Feliz
        KLARA_S,        // VinFast Klara S
        KLARA_A2,       // VinFast Klara A2
        TEMPEST,        // VinFast Tempest
        VENTO,          // VinFast Vento

        // Ô tô điện
        VF_5,           // VinFast VF 5
        VF_6,           // VinFast VF 6
        VF_7,           // VinFast VF 7
        VF_8,           // VinFast VF 8
        VF_9            // VinFast VF 9
    }

    public enum BatteryType {
        LITHIUM_ION,
        NICKEL_METAL_HYDRIDE,
        LEAD_ACID
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleType vehicleType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BatteryType batteryType;

    @Column(nullable = false)
    private boolean isActive = true;

    @CreationTimestamp
    @Column(nullable = false)
    private LocalDateTime createAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updateAt;
}
