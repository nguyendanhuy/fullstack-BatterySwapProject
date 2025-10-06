package BatterySwapStation.dto;

import lombok.Data;

@Data
public class PaymentRequest {
    private String invoiceNumber;
    private String buyerName;
    private String buyerEmail;
    private String buyerPhone;
    // Có thể bổ sung thêm các trường paymentMethod, amount nếu cần
}
