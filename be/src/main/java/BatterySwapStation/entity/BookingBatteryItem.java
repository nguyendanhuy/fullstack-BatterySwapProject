package BatterySwapStation.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "BookingBatteryItem")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingBatteryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ItemId")
    private Long itemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "BookingId", nullable = false)
    private Booking booking;

    @Enumerated(EnumType.STRING)
    @Column(name = "BatteryType", nullable = false, length = 50)
    private BatteryType batteryType;

    @Column(name = "Quantity", nullable = false)
    private int quantity;

    @Column(name = "PricePerUnit", nullable = false)
    private double pricePerUnit;

    public enum BatteryType {
        LITHIUM_ION,
        NICKEL_METAL_HYDRIDE,
        LEAD_ACID
    }
}
