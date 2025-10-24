package BatterySwapStation.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserId", nullable = false)
    @JsonIgnore // Tránh serialize toàn bộ User object
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "StationId", nullable = false)
    @JsonIgnore // Tránh serialize toàn bộ Station object
    private Station station;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VehicleId", nullable = false)
    @JsonIgnore // Tránh serialize toàn bộ Vehicle object
    private Vehicle vehicle;

    @Column(name = "vehicletype", length = 50)
    private String vehicleType;

    @Column(name = "amount")
    private Double amount;

    @Column(name = "bookingdate", nullable = false)
    private LocalDate bookingDate;

    @Column(name = "timeslot", nullable = false)
    private LocalTime timeSlot;

    public enum BookingStatus {
        PENDINGPAYMENT,  // Chờ thanh toán
        PENDINGSWAPPING, // Đã thanh toán, chờ đổi pin
        CANCELLED,       // Đã hủy
        COMPLETED,        // Hoàn thành
        FAILED    // Thất bại, áp dụng trong trường hợp thanh toán thất bại
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "bookingstatus", nullable = false, length = 20)
    private BookingStatus bookingStatus = BookingStatus.PENDINGPAYMENT;


    @Column(name = "CompletedTime")
    private LocalDate completedTime;

    @Column(name = "CancellationReason", length = 500)
    private String cancellationReason;

    @Column(name = "Notes", length = 1000)
    private String notes;

    // Lưu số pin muốn đổi (bị giới hạn bởi Vehicle.batteryCount)
    @Column(name = "BatteryCount")
    private Integer batteryCount;

    @Column(name = "batterytype", length = 50)
    private String batteryType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "InvoiceId")
    @JsonIgnore // Tránh serialize Invoice object
    private Invoice invoice;

    /**
     * Liên kết @OneToOne đến kết quả Inspection.
     * Một booking chỉ có 1 lần kiểm tra pin trả về.
     */
    /**
     * [SỬA LỖI] Liên kết @OneToMany đến các Inspection.
     * Một Booking có thể có NHIỀU Inspection (mỗi pin 1 cái).
     */
    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<BatteryInspection> inspections; // Sửa: Dùng List và đổi tên thành 'inspections'

    /**
     * Liên kết @OneToMany đến các Ticket Tranh chấp.
     * Một booking có thể có nhiều ticket tranh chấp (hiếm, nhưng có thể).
     */
    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<DisputeTicket> disputeTickets;


}
