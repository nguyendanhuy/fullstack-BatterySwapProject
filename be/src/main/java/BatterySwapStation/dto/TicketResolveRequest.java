package BatterySwapStation.dto;

import BatterySwapStation.entity.DisputeTicket;
import BatterySwapStation.entity.Payment;
import lombok.Data;

@Data
public class TicketResolveRequest {

    private DisputeTicket.ResolutionMethod resolutionMethod; // PENALTY / REFUND / OTHER / NO_ACTION
    private String resolutionDescription;


    private DisputeTicket.PenaltyLevel penaltyLevel;
    private Payment.PaymentChannel paymentChannel;

}
