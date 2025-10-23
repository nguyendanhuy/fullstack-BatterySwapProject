package BatterySwapStation.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "UserSubscription")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserId", nullable = false)
    private User user; // Liên kết với User

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PlanId", nullable = false)
    private SubscriptionPlan plan; // Liên kết với Gói

    @Column(name = "StartDate", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "EndDate", nullable = false)
    private LocalDateTime endDate; // Quan trọng: Dùng để kiểm tra hết hạn

    public enum SubscriptionStatus {
        ACTIVE,     // Đang hoạt động (VIP)
        EXPIRED,    // Đã hết hạn
        CANCELLED   // Đã hủy
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "Status", nullable = false, length = 20)
    private SubscriptionStatus status;

    @Column(name = "AutoRenew", nullable = false)
    private boolean autoRenew = true; // Mặc định là tự động gia hạn

    /**
     * ✅ [THÊM MỚI] Số lượt đổi pin đã sử dụng trong chu kỳ này.
     * Sẽ được reset về 0 khi gia hạn (bằng Scheduler).
     */
    @Column(name = "UsedSwaps", nullable = false)
    private Integer usedSwaps = 0;
}