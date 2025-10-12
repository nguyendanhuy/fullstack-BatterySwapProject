package BatterySwapStation.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "BookingVehicleItem")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingVehicleItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ItemId")
    private Long itemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "BookingId", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VehicleId", nullable = false)
    private Vehicle vehicle;

    @Enumerated(EnumType.STRING)
    @Column(name = "BatteryType", nullable = false, length = 50)
    private Battery.BatteryType batteryType;

    @Column(name = "Quantity", nullable = false)
    private int quantity = 1;

    @Column(name = "PricePerUnit", nullable = false)
    private double pricePerUnit;
}
