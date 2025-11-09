package BatterySwapStation.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * 🔋 BatteryRebalance
 * Bảng lưu thông tin lệnh điều phối pin giữa các trạm.
 * Mỗi bản ghi = 1 "phiếu điều phối" (ví dụ: chuyển 20 pin từ kho trung tâm -> trạm Q7).
 */
@Entity
@Table(name = "BatteryRebalance")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class BatteryRebalance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 🏭 Trạm gửi (kho/trạm)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "FromStationId", nullable = false)
    private Station fromStation;

    // 📦 Trạm nhận
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ToStationId", nullable = false)
    private Station toStation;

    // ⚙️ Loại pin (LITHIUM_ION, LEAD_ACID, ...)
    @Enumerated(EnumType.STRING)
    @Column(name = "BatteryType", nullable = false, length = 50)
    private Battery.BatteryType batteryType;

    // 🔢 Số lượng pin trong chuyến điều phối
    @Column(name = "Quantity", nullable = false)
    private int quantity;

    // 📝 Ghi chú tùy chọn
    @Column(name = "Note", length = 500)
    private String note;

    // 🚚 Trạng thái điều phối
    @Enumerated(EnumType.STRING)
    @Column(name = "Status", nullable = false, length = 50)
    private RebalanceStatus status = RebalanceStatus.PENDING;

    // 🕒 Thời gian tạo lệnh
    @Column(name = "CreatedAt", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // 🗓️ Thời gian dự kiến (nếu là “đã lên lịch”)
    @Column(name = "ScheduledTime")
    private LocalDateTime scheduledTime;

    // ✅ ENUM trạng thái lệnh điều phối
    public enum RebalanceStatus {
        PENDING,        // Chờ xác nhận
        SCHEDULED,      // Đã lên lịch
        IN_TRANSIT,     // Đang vận chuyển
        COMPLETED,      // Hoàn thành
        CANCELLED       //  Đã hủy
    }
}
