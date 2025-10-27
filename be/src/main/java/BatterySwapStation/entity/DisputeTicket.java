package BatterySwapStation.entity;

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
public class DisputeTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Liên kết với booking
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bookingid")
    private Booking booking;

    // Khách hàng (người trả pin)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userid")
    private User user;

    // Staff (người tạo ticket)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staffid")
    private User createdByStaff;

    // Liên kết với bằng chứng kiểm tra
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspectionid")
    private BatteryInspection inspection;

    public enum TicketStatus {
        OPEN,
        IN_PROGRESS, // Đang xử lý
        RESOLVED,    // Đã giải quyết
        CLOSED       // Đã đóng
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private TicketStatus status = TicketStatus.OPEN;

    @Column(name = "title", nullable = false, length = 255)
    private String title; // Ví dụ: "Khách trả pin bị móp"

    @Column(name = "description", length = 1000)
    private String description; // Mô tả chi tiết

    @Column(name = "createdat")
    private LocalDateTime createdAt;

    @Column(name = "resolvedat")
    private LocalDateTime resolvedAt;

    // Liên kết Nhiều-1: Nhiều DisputeTicket có thể thuộc về 1 Station
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "StationId") // Tên cột khóa ngoại trong DB
    private Station station;
}