package BatterySwapStation.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Entity
@Table(name = "Booking")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "BookingId")
    private Long bookingId;

    // N-1: 1 User có nhiều Booking
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserId", nullable = false)
    private User user;

    // N-1: 1 Station có nhiều Booking
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "StationId", nullable = false)
    private Station station;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VehicleId", nullable = false)
    private Vehicle vehicle;

    @Column(name = "BookingTime", nullable = false)
    private LocalDateTime bookingTime;

    @Column(name = "ScheduledTime", nullable = false)
    private LocalDateTime scheduledTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "Status", nullable = false, length = 20)
    private BookingStatus status = BookingStatus.PENDING;

    @Column(name = "CompletedTime")
    private LocalDateTime completedTime;

    @Column(name = "CancellationReason", length = 500)
    private String cancellationReason;

    @Column(name = "Notes", length = 1000)
    private String notes;

    // Add legacy fields that might still exist in database
    @Column(name = "bookingdate")
    private LocalDate bookingDate;

    @Column(name = "timeslot")
    private LocalTime timeSlot;

    @Column(name = "bookingstatus", length = 20)
    private String bookingStatusLegacy;

    // Relationships with other entities
    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BookingBatteryItem> batteryItems;

    @OneToOne(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private Payment payment;

    // N-1: 1 Invoice có nhiều Booking
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "InvoiceId")
    private Invoice invoice;

    public enum BookingStatus {
        PENDING,
        CONFIRMED,
        CANCELLED,
        COMPLETED
    }

    // Ensure backward compatibility and sync fields
    @PrePersist
    @PreUpdate
    public void syncFields() {
        if (scheduledTime != null && bookingDate == null) {
            bookingDate = scheduledTime.toLocalDate();
        }
        if (scheduledTime != null && timeSlot == null) {
            timeSlot = scheduledTime.toLocalTime();
        }
        if (status != null && bookingStatusLegacy == null) {
            bookingStatusLegacy = status.name();
        }
    }
}
