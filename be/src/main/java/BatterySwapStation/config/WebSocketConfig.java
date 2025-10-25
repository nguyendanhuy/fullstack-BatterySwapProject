package BatterySwapStation.config;

import BatterySwapStation.websocket.BatteryWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final BatteryWebSocketHandler batteryWebSocketHandler;

    public WebSocketConfig(BatteryWebSocketHandler batteryWebSocketHandler) {
        this.batteryWebSocketHandler = batteryWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(batteryWebSocketHandler, "/ws-battery")
                .setAllowedOrigins("*");
    }
}
