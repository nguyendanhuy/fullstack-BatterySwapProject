package BatterySwapStation.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "DockSlot")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@ToString(exclude = {"dock", "battery"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class DockSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "DockSlotId")
    @EqualsAndHashCode.Include
    private Integer dockSlotId;

    // Số thứ tự trong dock (ví dụ: slot số 1, slot số 2)
    @Column(name = "SlotNumber", nullable = false)
    private Integer slotNumber;

    // N-1: Slot thuộc về Dock
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DockId", nullable = false)
    @JsonBackReference
    private Dock dock;

    // 1-1: Slot chứa 1 Battery
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "BatteryId", unique = true)
    @JsonManagedReference
    private Battery battery;

    // Trạng thái slot
    @Enumerated(EnumType.STRING)
    @Column(name = "SlotStatus", nullable = false, length = 50)
    private SlotStatus slotStatus = SlotStatus.EMPTY;

    @Column(name = "IsActive", nullable = false)
    private boolean isActive = true;

    public enum SlotStatus {
        EMPTY,
        OCCUPIED,
        RESERVED
    }

    public void setBattery(Battery battery) {
        this.battery = battery;
        if (battery != null && this.dock != null && this.dock.getStation() != null) {
            battery.setStationId(this.dock.getStation().getStationId());
        }
    }
}