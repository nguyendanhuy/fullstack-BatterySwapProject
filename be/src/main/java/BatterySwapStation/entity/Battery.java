package BatterySwapStation.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "Battery")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"dockSlot", "vehicle"})// ✅ [SỬA 1] Thêm 'vehicle' vào danh sách 'exclude'
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Battery {

    // ID định dạng BAT001, BAT002
    @Id
    @Column(name = "BatteryId", length = 10)
    @EqualsAndHashCode.Include
    private String batteryId;

    // (Các trường cũ giữ nguyên)
    @Enumerated(EnumType.STRING)
    @Column(name = "BatteryStatus", nullable = false, length = 50)
    private BatteryStatus batteryStatus = BatteryStatus.AVAILABLE;

    @Column(name = "CurrentCapacity")
    private Double currentCapacity;

    @Enumerated(EnumType.STRING)
    @Column(name = "BatteryType", nullable = false, length = 50)
    private BatteryType batteryType;

    @Column(name = "IsActive", nullable = false)
    private boolean isActive = true;

    // 1-1: Pin có thể nằm trong 1 slot
    @OneToOne(mappedBy = "battery", fetch = FetchType.LAZY)
    @JsonBackReference
    @JsonIgnore
    // (Không thêm @ToString.Exclude ở đây)
    private DockSlot dockSlot;

    // Liên kết với Vehicle
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VehicleId")
    @JsonIgnore
    // ✅ [SỬA 2] Xóa @ToString.Exclude (kiểu mới) khỏi đây
    private Vehicle vehicle;


    public enum BatteryType {
        LITHIUM_ION("Pin Lithium Ion"),
        NICKEL_METAL_HYDRIDE("Pin Nickel Metal Hydride"),
        LEAD_ACID("Pin Lead Acid");

        // (Code enum giữ nguyên)
        private final String displayName;
        BatteryType(String displayName) { this.displayName = displayName; }
        public String getDisplayName() { return displayName; }
        public static BatteryType fromString(String batteryType) { /* ... */ return LITHIUM_ION; }
        public static BatteryType[] getAllTypes() { return values(); }
    }

    public enum BatteryStatus {
        AVAILABLE,
        IN_USE,
        CHARGING,
        MAINTENANCE,
        WAITING
    }

    // (Các trường cũ còn lại giữ nguyên)
    @Column(name = "CycleCount")
    private Integer cycleCount;

    @Column(name = "StateOfHealth")
    private Double stateOfHealth;

    @Column(name = "ManufactureDate")
    private LocalDate manufactureDate;

    @Column(name = "ExpiryDate")
    private LocalDate expiryDate;

    @Column(name = "StationId")
    private Integer stationId;


    @OneToMany(mappedBy = "battery", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VehicleBattery> vehicleHistory = new ArrayList<>();

    // (Các hàm cũ giữ nguyên)
    public boolean isAvailableForBooking() {
        return this.isActive &&
                (this.batteryStatus == BatteryStatus.AVAILABLE ||
                        this.batteryStatus == BatteryStatus.CHARGING) &&
                this.stateOfHealth != null && this.stateOfHealth > 70.0;
    }

    public void assignStationFromDockSlot() {
        if (dockSlot != null && dockSlot.getDock() != null && dockSlot.getDock().getStation() != null) {
            this.stationId = dockSlot.getDock().getStation().getStationId();
        }
    }
}