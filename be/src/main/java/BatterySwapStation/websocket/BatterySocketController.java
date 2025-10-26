package BatterySwapStation.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
@RequiredArgsConstructor
public class BatterySocketController {

    private final SimpMessagingTemplate messagingTemplate;

    // Khi FE gửi message đến /app/joinStation
    @MessageMapping("/joinStation")
    public void handleJoinStation(Map<String, Object> payload) {
        System.out.println(" Client joined: " + payload);
    }

    // Gửi realtime đến tất cả FE subcribe trạm cụ thể
    public void broadcastToStation(Integer stationId, Object message) {
        if (stationId == null) return;
        messagingTemplate.convertAndSend("/topic/station-" + stationId, message);
    }

    // Gửi realtime cho admin (nhận toàn bộ)
    public void broadcastToAdmin(Object message) {
        messagingTemplate.convertAndSend("/topic/admin", message);
    }
}
