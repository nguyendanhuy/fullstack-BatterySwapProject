package BatterySwapStation.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class TicketRealtimeEvent {
    private Long ticketId;
    private Long invoiceId;
    private String status;   // PAID / FAILED / CASH_CONFIRMED
    private String message;
    private Integer stationId;
    private LocalDateTime time;
}
