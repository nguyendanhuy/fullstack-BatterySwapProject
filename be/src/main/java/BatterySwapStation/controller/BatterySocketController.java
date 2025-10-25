package BatterySwapStation.controller;

import BatterySwapStation.dto.BatteryRealtimeEvent;
import BatterySwapStation.websocket.BatteryWebSocketHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/socket")
public class BatterySocketController {

    private final BatteryWebSocketHandler batteryWebSocketHandler;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/push")
    public void pushBatteryEvent(@RequestBody BatteryRealtimeEvent event) {
        try {
            log.info("📤 Gửi realtime event tới WS clients: {}", event);
            String json = objectMapper.writeValueAsString(event);
            batteryWebSocketHandler.broadcast(json);
        } catch (Exception e) {
            log.error("Lỗi khi gửi realtime WS event", e);
        }
    }
}
