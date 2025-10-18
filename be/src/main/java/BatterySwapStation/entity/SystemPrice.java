package BatterySwapStation.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "SystemPrice")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class SystemPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "Id")
    @EqualsAndHashCode.Include
    private Long id;

    @Column(name = "Price", nullable = false)
    private Double price = 15000.0; // Giá mặc định 15,000 VND cho mỗi lượt đổi pin

    @Column(name = "Description", length = 500)
    private String description = "Giá mặc định cho mỗi lượt đổi pin";

    @Column(name = "CreatedDate", nullable = false)
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

    // Enum cho các loại quy luật giá (có thể mở rộng sau)
    public enum PriceType {
        BATTERY_SWAP("Giá đổi pin"),
        SERVICE_FEE("Phí dịch vụ"),
        MAINTENANCE("Phí bảo trì");

        private final String displayName;

        PriceType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    // Constructor với giá trị mặc định
    public SystemPrice(String description) {
        this.price = 15000.0;
        this.description = description != null ? description : "Giá mặc định cho mỗi lượt đổi pin";
    }

    public SystemPrice(Double price, String description) {
        this.price = price != null ? price : 15000.0;
        this.description = description != null ? description : "Giá mặc định cho mỗi lượt đổi pin";
    }

    // Method để lấy giá với fallback
    public Double getSafePrice() {
        return this.price != null ? this.price : 15000.0;
    }

    // Method kiểm tra có phải giá mặc định không
    public boolean isDefaultPrice() {
        return this.price != null && this.price.equals(15000.0);
    }
}
