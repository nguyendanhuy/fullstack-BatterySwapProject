package BatterySwapStation.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

@Data
public class UseSwapRequest {

    // (Test Mode) ID của user đang thực hiện
    @NotNull(message = "UserId là bắt buộc")
    private String userId;

    // ID của hóa đơn (Invoice) 0 ĐỒNG
    @NotNull(message = "InvoiceId là bắt buộc")
    private Long invoiceId;

}