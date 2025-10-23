package BatterySwapStation.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "Swap")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Swap {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SwapId")
    private Long swapId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "BookingId", nullable = false)
    private Booking booking;

    @Column(name = "DockId", nullable = false)
    private Integer dockId; // trụ thực hiện swap

    @Column(name = "UserId", nullable = false, length = 20)
    private String userId;

    @Column(name = "BatteryOutId", length = 20)
    private String batteryOutId;

    @Column(name = "BatteryInId", length = 20)
    private String batteryInId;

    @Column(name = "StaffUserId", nullable = false, length = 20)
    private String staffUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status", length = 30)
    private SwapStatus status = SwapStatus.SUCCESS;

    @Column(name = "DockOutSlot")
    private String dockOutSlot; // slot nhả pin đầy

    @Column(name = "DockInSlot")
    private String dockInSlot; // slot đút pin cũ vào (nếu có)

    @Column(name = "CompletedTime")
    private LocalDateTime completedTime = LocalDateTime.now();

    @Column(name = "Description", length = 1000)
    private String description;


    public enum SwapStatus {
        SUCCESS,
        CANCELLED

    }
}
