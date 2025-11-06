package BatterySwapStation.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "DisputeTicket")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class DisputeTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Liên kết với booking
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bookingid")
    @JsonIgnore
    private Booking booking;

    // Khách hàng (người trả pin)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userid")
    @JsonIgnore
    private User user;

    // Staff (người tạo ticket)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staffid")
    @JsonIgnore
    private User createdByStaff;

    // ---------------- ENUM & STATUS ----------------

    public enum TicketStatus {
        IN_PROGRESS, // Đang xử lý
        RESOLVED     // Đã giải quyết
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private TicketStatus status = TicketStatus.IN_PROGRESS;

    public enum DisputeReason {
        BAD_CONDITION, // Tình trạng vật lý kém (trầy xước, nứt vỡ)
        SOH,           // State of Health (SOH) thấp hơn tiêu chuẩn
        OTHER          // Lý do khác
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "reason")
    private DisputeReason reason;

    // ---------------- THÔNG TIN CƠ BẢN ----------------

    @Column(name = "title", nullable = false, length = 255)
    private String title; // Ví dụ: "Khách trả pin bị móp"

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "createdat")
    private LocalDateTime createdAt;

    @Column(name = "resolvedat")
    private LocalDateTime resolvedAt;

    // ---------------- GIẢI QUYẾT ----------------

    @Column(name = "resolutionmethod", length = 255)
    private String resolutionMethod;

    @Column(name = "resolutiondescription", length = 1000)
    private String resolutionDescription;

    public enum ResolutionMethod {
        PENALTY,   // Thu phí phạt
        REFUND,    // Hoàn tiền khách
        NO_ACTION, // Không xử lý (false alarm)
        OTHER
    }

    public enum PenaltyLevel {
        NONE,
        MINOR,
        MEDIUM,
        SEVERE
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "penaltylevel", length = 20)
    private PenaltyLevel penaltyLevel;

    // 🆕 Kênh thanh toán được chọn cho hình thức phạt (WALLET / CASH / VNPAY)
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_channel", length = 20)
    private Payment.PaymentChannel paymentChannel;

    // ---------------- LIÊN KẾT ----------------

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoiceid")
    @JsonIgnore
    private Invoice penaltyInvoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "StationId")
    @JsonIgnore
    private Station station;
}
