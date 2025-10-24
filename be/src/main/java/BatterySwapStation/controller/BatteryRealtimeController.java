package BatterySwapStation.controller;

import BatterySwapStation.dto.BatteryRealtimeEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/realtime/battery")
@RequiredArgsConstructor
public class BatteryRealtimeController {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * API gửi realtime đến FE staff (topic theo stationId)
     */
    @PostMapping("/notify")
    public void notifyBatteryChange(@RequestBody BatteryRealtimeEvent event) {
        if (event.getTimestamp() == null)
            event.setTimestamp(LocalDateTime.now().toString());

        messagingTemplate.convertAndSend("/topic/station-" + event.getStationId(), event);
    }
}
