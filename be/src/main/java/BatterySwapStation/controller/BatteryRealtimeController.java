package BatterySwapStation.controller;

import BatterySwapStation.websocket.BatteryWebSocketHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/realtime/battery")
@RequiredArgsConstructor
@Slf4j
public class BatteryRealtimeController {

    private final BatteryWebSocketHandler batteryWebSocketHandler;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/notify")
    public void notifyBatteryChange(@RequestBody Map<String, Object> payload) throws IOException {
        String json = objectMapper.writeValueAsString(payload);
        log.info("🚀 Broadcasting: {}", json);

        for (WebSocketSession session : batteryWebSocketHandler.getSessions()) {
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(json));
            }
        }
    }
}
