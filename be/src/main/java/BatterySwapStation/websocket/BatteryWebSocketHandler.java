package BatterySwapStation.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Data
@Component
public class BatteryWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<Integer, Set<WebSocketSession>> stationSessions = new ConcurrentHashMap<>();
    private final Set<WebSocketSession> adminSessions = new CopyOnWriteArraySet<>();
    private final Map<WebSocketSession, Integer> sessionStationMap = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        System.out.println("🔌 New WebSocket connection: " + session.getId());
        try {
            session.sendMessage(new TextMessage("{\"message\": \"Connected to Battery WebSocket\"}"));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) {
        String payload = message.getPayload();
        System.out.println("📩 Received from client: " + payload);

        try {
            Map<String, Object> json = objectMapper.readValue(payload, Map.class);
            String action = (String) json.get("action");

            // FE gửi yêu cầu JOIN_STATION
            if ("JOIN_STATION".equalsIgnoreCase(action)) {
                Integer stationId = (Integer) json.get("stationId");
                if (stationId != null) {
                    stationSessions.computeIfAbsent(stationId, k -> new CopyOnWriteArraySet<>()).add(session);
                    sessionStationMap.put(session, stationId);
                    System.out.println("👤 Session " + session.getId() + " joined station " + stationId);
                    session.sendMessage(new TextMessage("{\"joinedStation\": " + stationId + "}"));
                }
                return;
            }

            //  FE gửi yêu cầu JOIN_ALL (admin)
            if ("JOIN_ALL".equalsIgnoreCase(action)) {
                adminSessions.add(session);
                System.out.println("🧭 Admin session joined all stations: " + session.getId());
                session.sendMessage(new TextMessage("{\"joinedAll\": true}"));
                return;
            }

            //  Nếu là realtime update từ device hoặc BE
            if (json.containsKey("stationId")) {
                Integer stationId = (Integer) json.get("stationId");
                broadcastToStation(stationId, payload);
            }

        } catch (Exception e) {
            e.printStackTrace();
            try {
                session.sendMessage(new TextMessage("{\"error\": \"Invalid message format\"}"));
            } catch (IOException ignored) {}
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        System.out.println("WebSocket closed: " + session.getId());

        // Xóa khỏi map station nếu có
        Integer stationId = sessionStationMap.remove(session);
        if (stationId != null) {
            Set<WebSocketSession> sessions = stationSessions.get(stationId);
            if (sessions != null) sessions.remove(session);
        }

        //  Xóa khỏi adminSessions nếu có
        adminSessions.remove(session);
    }

    //  Gửi message tới tất cả client của 1 trạm cụ thể + admin
    public void broadcastToStation(Integer stationId, String message) {
        if (stationId == null) return;

        Set<WebSocketSession> sessions = stationSessions.get(stationId);
        int staffCount = (sessions == null) ? 0 : sessions.size();
        System.out.println("📡 Broadcast to station " + stationId + " (" + staffCount + " staff, " + adminSessions.size() + " admin)");

        // 🔸 Gửi cho staff của trạm đó
        if (sessions != null) {
            for (WebSocketSession s : sessions) {
                if (s.isOpen()) {
                    try {
                        s.sendMessage(new TextMessage(message));
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                }
            }
        }

        // 🔸 Gửi cho admin (xem tất cả trạm)
        for (WebSocketSession admin : adminSessions) {
            if (admin.isOpen()) {
                try {
                    admin.sendMessage(new TextMessage(message));
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
