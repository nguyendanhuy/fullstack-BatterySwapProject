package BatterySwapStation.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Vehicle", indexes = {
        @Index(name = "idx_vehicle_vin", columnList = "VIN", unique = true)
})
@Getter
@Setter
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "VehicleId", nullable = false)
    private int vehicleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserId")
    @JsonBackReference
    @ToString.Exclude
    private User user;

    @Column(name = "VIN", nullable = false, length = 100, unique = true)
    private String VIN;

    public enum VehicleType {
        THEON, FELIZ, KLARA_S, KLARA_A2, TEMPEST, VENTO,
        VF_5, VF_6, VF_7, VF_8, VF_9
    }

    public enum BatteryType {
        LITHIUM_ION, NICKEL_METAL_HYDRIDE, LEAD_ACID
    }

    @Enumerated(EnumType.STRING)
    private VehicleType vehicleType;

    @Enumerated(EnumType.STRING)
    private BatteryType batteryType;

    @Column(nullable = false)
    private boolean isActive = false;

    // 1–1 với VehiclePurchaseInvoice, nối qua VIN
    @OneToOne(mappedBy = "vehicle", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JsonManagedReference
    private VehiclePurchaseInvoice purchaseInvoice;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Vehicle vehicle = (Vehicle) o;
        return vehicleId > 0 && vehicleId == vehicle.vehicleId;
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
