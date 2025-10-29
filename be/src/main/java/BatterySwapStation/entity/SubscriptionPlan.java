package BatterySwapStation.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "SubscriptionPlan")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "PlanName", nullable = false, length = 100)
    private String planName; // "Gói Cơ bản"

    @Column(name = "Description", length = 500)
    private String description; // "Phù hợp cho việc sử dụng hàng ngày"

    @Column(name = "DurationInDays", nullable = false)
    private Integer durationInDays; // Ví dụ: 30

    /**
     * Liên kết với SystemPrice để lấy giá.
     * Phải là UNIQUE để đảm bảo 1-1.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "PriceType", nullable = false, length = 50, unique = true)
    private SystemPrice.PriceType priceType;

    /**
     * ✅ [THÊM MỚI] Giới hạn số lượt đổi pin.
     * NULL hoặc -1 có nghĩa là "Không giới hạn".
     */
    @Column(name = "SwapLimit")
    private Integer swapLimit; // 10, 20, hoặc null/-1
}