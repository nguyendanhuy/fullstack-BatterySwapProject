package BatterySwapStation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {
    private boolean success;
    private String message;
    private String invoiceNumber;
    private Long pendingBookingId;
    private Double amount;
    private LocalDateTime paymentDeadline;
}
