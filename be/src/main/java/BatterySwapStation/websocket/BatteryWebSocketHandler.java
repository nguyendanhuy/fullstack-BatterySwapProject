package BatterySwapStation.websocket;

import lombok.Data;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.concurrent.CopyOnWriteArraySet;

@Data
@Component
public class BatteryWebSocketHandler extends TextWebSocketHandler {

    // Danh sách các kết nối WebSocket đang mở
    private final CopyOnWriteArraySet<WebSocketSession> sessions = new CopyOnWriteArraySet<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
        System.out.println("New WebSocket connection: " + session.getId());
        try {
            session.sendMessage(new TextMessage("{\"message\": \"Connected to Battery WebSocket\"}"));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) {
        System.out.println("📩 Received from client: " + message.getPayload());
        try {
            session.sendMessage(new TextMessage("{\"echo\": \"" + message.getPayload() + "\"}"));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        System.out.println("WebSocket closed: " + session.getId());
    }

    // 🟢 Gửi message tới tất cả client đang kết nối
    public void broadcast(String message) {
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage(message));
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
