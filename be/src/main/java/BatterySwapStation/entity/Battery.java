package BatterySwapStation.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "Battery")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"dockSlot"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Battery {

    // ID định dạng BAT001, BAT002
    @Id
    @Column(name = "BatteryId", length = 10)
    @EqualsAndHashCode.Include
    private String batteryId;

    @Enumerated(EnumType.STRING)
    @Column(name = "BatteryStatus", nullable = false, length = 50)
    private BatteryStatus batteryStatus = BatteryStatus.AVAILABLE;

    @Enumerated(EnumType.STRING)
    @Column(name = "BatteryType", nullable = false, length = 50)
    private BatteryType batteryType;

    @Column(name = "IsActive", nullable = false)
    private boolean isActive = true;

    // 1-1: Pin có thể nằm trong 1 slot
    @OneToOne(mappedBy = "battery", fetch = FetchType.LAZY)
    @JsonBackReference
    private DockSlot dockSlot;

    public enum BatteryType {
        LITHIUM_ION,
        NICKEL_METAL_HYDRIDE,
        LEAD_ACID
    }

    public enum BatteryStatus {
        AVAILABLE,
        IN_USE,
        CHARGING,
        DAMAGED
    }

    @Column(name = "CycleCount")
    private Integer cycleCount; // số chu kỳ sạc xả

    @Column(name = "StateOfHealth")
    private Double stateOfHealth; // phần trăm SoH

    @Column(name = "ManufactureDate")
    private LocalDate manufactureDate;

    @Column(name = "ExpiryDate")
    private LocalDate expiryDate;

}
