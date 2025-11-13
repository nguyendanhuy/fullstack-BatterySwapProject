package BatterySwapStation.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
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
    @JoinColumn(name = "StationId") // ✅ Removed nullable = false to match database reality
    @JsonIgnore // Tránh serialize toàn bộ Station object
    private Station station;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "VehicleId") // ✅ Removed nullable = false to match database reality
    @JsonIgnore // Tránh serialize toàn bộ Vehicle object
    private Vehicle vehicle;

    @Column(name = "vehicletype", length = 50)
    private String vehicleType;

    @Column(name = "amount")
    private Double amount;

    @Column(name = "totalprice")
    private Double totalPrice; // Giá cuối cùng sau khi tính gói tháng

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
    @Column(name = "batterycount")  // ✅ FIX: Dùng lowercase để khớp với PostgreSQL auto-convert
    private Integer batteryCount;

    @Column(name = "batterytype", length = 50)
    private String batteryType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "InvoiceId")
    @JsonIgnore // Tránh serialize Invoice object
    private Invoice invoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "RefundInvoiceId")
    @JsonIgnore
    private Invoice refundInvoice;


    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<BatteryInspection> inspections; // Sửa: Dùng List và đổi tên thành 'inspections'

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<DisputeTicket> disputeTickets;


}
