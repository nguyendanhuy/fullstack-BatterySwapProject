package BatterySwapStation.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data @AllArgsConstructor
public class VnPayCreatePaymentResponse {
    private String paymentUrl; // FE redirect tới đây
}
