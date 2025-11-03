package BatterySwapStation.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class TicketSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    public void notifyPenaltyPaid(Long ticketId, Integer stationId) {
        messagingTemplate.convertAndSend(
                "/topic/station-" + stationId + "/tickets",
                new TicketPaidEvent(ticketId, "PENALTY_PAID")
        );
    }

    public record TicketPaidEvent(Long ticketId, String event) {}
}
