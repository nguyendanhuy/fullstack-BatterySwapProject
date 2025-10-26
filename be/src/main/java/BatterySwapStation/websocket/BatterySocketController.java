package BatterySwapStation.websocket;

import BatterySwapStation.dto.DockBatteryGroupDTO;
import BatterySwapStation.service.StationService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class BatterySocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final StationService stationService;

    /**
     * FE gửi tới /app/joinStation
     * payload: { "stationId": 12 }
     *
     * BE sẽ gửi lại danh sách pin grouped (chỉ pin trong dock)
     * qua kênh: /topic/station-12/grouped
     */
    @MessageMapping("/joinStation")
    public void handleJoinStation(Map<String, Object> payload) {
        Integer stationId = extractStationId(payload);
        if (stationId == null) return;

        System.out.println("⚡ Client joined station " + stationId);

        // Lấy dữ liệu grouped pin theo dock
        List<DockBatteryGroupDTO> data = stationService.getGroupedBatteriesOnly(stationId);

        // Gửi dữ liệu realtime tới kênh /topic/station-{id}/grouped
        messagingTemplate.convertAndSend("/topic/station-" + stationId + "/grouped", data);
    }

    /**
     * Gửi realtime đến tất cả client đang subscribe kênh grouped
     */
    public void broadcastToStation(Integer stationId, Object message) {
        if (stationId == null) return;
        messagingTemplate.convertAndSend("/topic/station-" + stationId + "/grouped", message);
    }

    /**
     * Gửi realtime cho admin (nhận toàn bộ hệ thống)
     */
    public void broadcastToAdmin(Object message) {
        messagingTemplate.convertAndSend("/topic/admin", message);
    }

    /**
     * Helper: đọc stationId từ payload của FE
     */
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
}
