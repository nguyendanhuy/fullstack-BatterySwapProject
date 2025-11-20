package BatterySwapStation.websocket;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.lang.reflect.Type;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Component
public class TicketSocketClient {

    private static final String WS_URL =
            "wss://batteryswap.up.railway.app/ws-battery/websocket";

    private WebSocketStompClient stompClient;
    private StompSession session;

    @PostConstruct
    public void connect() {
        try {
            log.info("🌐 [LOCAL SOCKET] Connecting to Railway WS: {}", WS_URL);

            stompClient = new WebSocketStompClient(new StandardWebSocketClient());
            stompClient.setMessageConverter(new MappingJackson2MessageConverter());

            ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
            scheduler.initialize();
            stompClient.setTaskScheduler(scheduler);

            CompletableFuture<StompSession> future = stompClient.connectAsync(
                    WS_URL,
                    new WebSocketHttpHeaders(),
                    new StompHeaders(),
                    new StompSessionHandlerAdapter() {
                        @Override
                        public void afterConnected(StompSession session, StompHeaders connectedHeaders) {
                            log.info("✅ [LOCAL SOCKET] Connected to Railway WebSocket!");

                            // Lắng nghe mọi ticket của station-1
                            session.subscribe("/topic/station-1/tickets", new TicketEventHandler());
                        }

                        @Override
                        public void handleTransportError(StompSession session, Throwable ex) {
                            log.error("[LOCAL SOCKET] Transport error: {}", ex.getMessage());
                        }
                    }
            );

            session = future.get();

        } catch (Exception e) {
            log.error("⚠️ [LOCAL SOCKET] WebSocket connection failed: {}", e.getMessage());
        }
    }

    @PreDestroy
    public void disconnect() {
        if (session != null && session.isConnected()) {
            session.disconnect();
            log.info("🔌 [LOCAL SOCKET] WS disconnected.");
        }
    }

    private static class TicketEventHandler implements StompFrameHandler {
        @Override
        public Type getPayloadType(StompHeaders headers) {
            return TicketSocketController.TicketPaidEvent.class;
        }

        @Override
        public void handleFrame(StompHeaders headers, Object payload) {
            TicketSocketController.TicketPaidEvent event =
                    (TicketSocketController.TicketPaidEvent) payload;

            log.info("📩 [REALTIME RECEIVED] Ticket #{} | Event = {}",
                    event.ticketId(), event.event());
        }
    }
}
