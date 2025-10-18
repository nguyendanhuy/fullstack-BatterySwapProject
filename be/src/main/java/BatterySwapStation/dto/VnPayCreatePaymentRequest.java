package BatterySwapStation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * FE chỉ truyền invoiceId, BE tự tìm totalAmount trong Invoice.
 */
@Data
public class VnPayCreatePaymentRequest {
    @Schema(description = "Mã hóa đơn cần thanh toán", example = "10005", required = true)
    private Long invoiceId;

    @Schema(description = "Mã ngân hàng (VD: VNPAY)", example = "VNPAY")
    private String bankCode;

    @Schema(hidden = true)
    private String locale = "vn";

    @Schema(description = "Loại đơn hàng (VD: other, electric, etc.)", example = "other")
    private String orderType = "other";


}
