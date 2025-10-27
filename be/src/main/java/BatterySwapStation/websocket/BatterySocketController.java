package BatterySwapStation.websocket;

import BatterySwapStation.dto.DockBatteryGroupDTO;
import BatterySwapStation.service.StationService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class BatterySocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final StationService stationService;

    @MessageMapping("/joinStation")
    public void handleJoinStation(Map<String, Object> payload) {
        Integer stationId = extractStationId(payload);
        if (stationId == null) return;

        System.out.println("Client joined station " + stationId);

        // Gửi snapshot grouped pin theo dock
        List<DockBatteryGroupDTO> data = stationService.getGroupedBatteriesOnly(stationId);
        messagingTemplate.convertAndSend("/topic/station-" + stationId + "/grouped", data);
    }


    public void broadcastToStation(Integer stationId, Object message) {
        if (stationId == null) return;
        messagingTemplate.convertAndSend("/topic/station-" + stationId, message);
    }


    public void broadcastToAdmin(Object message) {
        messagingTemplate.convertAndSend("/topic/admin", message);
    }


    private Integer extractStationId(Map<String, Object> payload) {
        if (payload == null || !payload.containsKey("stationId")) return null;
        Object idObj = payload.get("stationId");
        if (idObj instanceof Number n) return n.intValue();
        try {
            return Integer.parseInt(idObj.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @GetMapping("/test-socket")
    @ResponseBody
    public String sendTestMessage() {
        messagingTemplate.convertAndSend("/topic/station-12",
                Map.of("batteryId", "BAT123", "status", "AVAILABLE"));
        System.out.println("🚀 Đã gửi test message tới /topic/station-12");
        return "Sent";
    }
}
