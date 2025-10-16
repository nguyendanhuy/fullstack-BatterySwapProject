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

    // Thêm giá pin cho việc tính tiền
    @Column(name = "Price")
    private Double price = 25000.0; // Giá mặc định 25,000 VND

    // Liên kết với Station
    @Column(name = "StationId")
    private Integer stationId;

    // Phương thức tính giá dựa trên loại pin
    public Double getCalculatedPrice() {
        if (this.price != null && this.price > 0) {
            return this.price;
        }

        // Giá mặc định theo loại pin
        switch (this.batteryType) {
            case LITHIUM_ION:
                return 30000.0; // 30k cho Lithium Ion
            case NICKEL_METAL_HYDRIDE:
                return 25000.0; // 25k cho Nickel Metal Hydride
            case LEAD_ACID:
                return 20000.0; // 20k cho Lead Acid
            default:
                return 25000.0; // Giá mặc định
        }
    }

    // Kiểm tra pin có sẵn để đặt không
    public boolean isAvailableForBooking() {
        return this.isActive &&
                (this.batteryStatus == BatteryStatus.AVAILABLE ||
                        this.batteryStatus == BatteryStatus.CHARGING) &&
                this.stateOfHealth != null && this.stateOfHealth > 70.0; // SoH > 70%
    }
}
