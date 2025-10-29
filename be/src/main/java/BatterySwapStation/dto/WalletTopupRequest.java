package BatterySwapStation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class WalletTopupRequest {

    @Schema(description = "Số tiền cần nạp vào ví (VNĐ)", example = "200000", required = true)
    private Double amount;

    @Schema(description = "Mã ngân hàng (VD: NCB, VNPAY...)", example = "VNPAY")
    private String bankCode;

    @Schema(hidden = true)
    private String locale = "vn";

    @Schema(description = "Loại đơn hàng", example = "wallet_topup")
    private String orderType = "wallet_topup";
}
