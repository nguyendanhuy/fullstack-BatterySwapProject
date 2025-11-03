package BatterySwapStation.dto;

import BatterySwapStation.entity.DisputeTicket;
import BatterySwapStation.entity.Payment;
import lombok.Data;

@Data
public class TicketResolveRequest {
    private DisputeTicket.ResolutionMethod resolutionMethod; //
    private String resolutionDescription;
    private DisputeTicket.PenaltyLevel penaltyLevel; // MINOR / MEDIUM / SEVERE
    private Payment.PaymentChannel paymentChannel;         // mô tả thêm
}

