package BatterySwapStation.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Booking")
@Getter
@Setter
@ToString
@AllArgsConstructor
@NoArgsConstructor
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "BookingId")
    private int bookingId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserId", nullable = false)
    @JsonBackReference
    @ToString.Exclude
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VehicleId", nullable = false)
    @ToString.Exclude
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "StationId", nullable = false)
    @ToString.Exclude
    private Station station;

    @Column(name = "BookingTime", nullable = false)
    private LocalDateTime bookingTime;

    @Column(name = "ScheduledTime", nullable = false)
    private LocalDateTime scheduledTime;

    public enum BookingStatus {
        PENDING,      // Chờ xác nhận
        CONFIRMED,    // Đã xác nhận
        COMPLETED,    // Đã hoàn thành
        CANCELLED     // Đã hủy
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "Status", nullable = false)
    private BookingStatus status = BookingStatus.PENDING;

    @Column(name = "CompletedTime")
    private LocalDateTime completedTime;

    @Column(name = "CancellationReason", length = 500)
    private String cancellationReason;

    @Column(name = "Notes", length = 1000)
    private String notes;

    @PrePersist
    protected void onCreate() {
        bookingTime = LocalDateTime.now();
    }
}