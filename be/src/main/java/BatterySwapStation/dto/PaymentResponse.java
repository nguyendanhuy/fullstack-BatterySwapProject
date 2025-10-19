package BatterySwapStation.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PaymentResponse {
    private String txnRef;
    private String paymentStatus;
    private String invoiceStatus;
    private Long invoiceId;
    private Double amount;
    private String gateway;
    private String vnpTransactionNo;
    private String vnpResponseCode;
    private String vnpBankCode;
    private String vnpPayDate;
    private LocalDateTime createdAt;
    private String message;
}
