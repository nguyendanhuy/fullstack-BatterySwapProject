package BatterySwapStation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import jakarta.validation.constraints.NotNull;

@Data
public class SubscriptionRequest {

    @NotNull(message = "PlanId là bắt buộc")
    private Integer planId; // (Hoặc Long, tùy kiểu ID của SubscriptionPlan)

    // (Chúng ta dùng Test Mode, nên cần userId)
    @NotNull(message = "UserId là bắt buộc")
    private String userId;
    @Schema (example = "WALLET", description = "Phương thức thanh toán: 'WALLET' hoặc 'VNPAY'")
    private String paymentMethod; // "WALLET" hoặc "VNPAY"

}