package BatterySwapStation.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
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
    @JsonIgnore // Thêm để tránh serialize
    private DockSlot dockSlot;

    public enum BatteryType {
        LITHIUM_ION("Pin Lithium Ion"),
        NICKEL_METAL_HYDRIDE("Pin Nickel Metal Hydride"),
        LEAD_ACID("Pin Lead Acid");

        private final String displayName;

        BatteryType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }

        public static BatteryType fromString(String batteryType) {
            if (batteryType == null || batteryType.trim().isEmpty()) {
                return LITHIUM_ION; // Default
            }

            String normalized = batteryType.trim().toUpperCase().replace("-", "_").replace(" ", "_");

            try {
                return BatteryType.valueOf(normalized);
            } catch (IllegalArgumentException e) {
                // Xử lý các trường hợp đặc biệt
                switch (normalized) {
                    case "LITHIUM":
                    case "LI_ION":
                    case "LITHIUM_ION_BATTERY":
                        return LITHIUM_ION;
                    case "NICKEL":
                    case "NIMH":
                    case "NI_MH":
                        return NICKEL_METAL_HYDRIDE;
                    case "LEAD":
                    case "LEAD_ACID_BATTERY":
                    case "PB_ACID":
                        return LEAD_ACID;
                    default:
                        return LITHIUM_ION;
                }
            }
        }

        public static BatteryType[] getAllTypes() {
            return values();
        }
    }

    public enum BatteryStatus {
        AVAILABLE,
        IN_USE,
        CHARGING,
        MAINTENANCE
    }

    @Column(name = "CycleCount")
    private Integer cycleCount; // số chu kỳ sạc xả

    @Column(name = "StateOfHealth")
    private Double stateOfHealth; // phần trăm SoH

    @Column(name = "ManufactureDate")
    private LocalDate manufactureDate;

    @Column(name = "ExpiryDate")
    private LocalDate expiryDate;


    // Liên kết với Station
    @Column(name = "StationId")
    private Integer stationId;


    // Kiểm tra pin có sẵn để đặt không
    public boolean isAvailableForBooking() {
        return this.isActive &&
                (this.batteryStatus == BatteryStatus.AVAILABLE ||
                        this.batteryStatus == BatteryStatus.CHARGING) &&
                this.stateOfHealth != null && this.stateOfHealth > 70.0; // SoH > 70%
    }
}
