package BatterySwapStation.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "SystemPrice")
@Getter
@Setter
@NoArgsConstructor // Lombok sẽ tạo constructor rỗng
@AllArgsConstructor // Lombok sẽ tạo constructor cho tất cả các trường
@Builder
@ToString
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class SystemPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    @EqualsAndHashCode.Include
    private Long id;

    // ✅ BƯỚC 1: Thêm trường này để định danh loại giá
    @Enumerated(EnumType.STRING)
    @Column(name = "PriceType", nullable = false, unique = true, length = 50)
    private PriceType priceType;

    // ✅ BƯỚC 2: Xóa giá trị mặc định (15000.0)
    @Column(name = "Price", nullable = false)
    private Double price;
    // LƯU Ý: Nên dùng BigDecimal cho tiền tệ để tránh lỗi làm tròn

    // ✅ BƯỚC 3: Xóa giá trị mặc định
    @Column(name = "Description", length = 500)
    private String description;

    @Column(name = "CreatedDate", nullable = false, updatable = false)
    private LocalDateTime createdDate;

    @Column(name = "UpdatedDate")
    private LocalDateTime updatedDate;

    @PrePersist
    protected void onCreate() {
        createdDate = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedDate = LocalDateTime.now();
    }

    // Enum cho các loại quy luật giá (Giữ nguyên)
    public enum PriceType {
        BATTERY_SWAP("Giá đổi pin"),
        SERVICE_FEE("Phí dịch vụ"),
        MAINTENANCE("Phí bảo trì"),
        MONTHLY_SUBSCRIPTION_BASIC("Gói tháng Cơ bản - 299k"),
        MONTHLY_SUBSCRIPTION_PREMIUM("Gói tháng Cao cấp - 499k"),
        MONTHLY_SUBSCRIPTION_BUSINESS("Gói tháng Doanh nghiệp - 899k"),
        DAMAGE_FEE("Phí đền bù hư hỏng pin"),
        PENALTY_MINOR("Phạt hư hại nhẹ"),
        PENALTY_MEDIUM("Phạt hư hại vừa"),
        PENALTY_SEVERE("Phạt hư hại nặng");

        private final String displayName;

        PriceType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    // ✅ BƯỚC 4: Xóa các constructor cũ và các hàm helper
    // (Xóa: SystemPrice(String description), SystemPrice(Double price, ...))
    // (Xóa: getSafePrice(), isDefaultPrice())
}