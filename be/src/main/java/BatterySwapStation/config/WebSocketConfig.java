package BatterySwapStation.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Prefix cho các kênh BE gửi message tới FE
        config.enableSimpleBroker("/topic", "/queue");

        //  Prefix cho các endpoint BE mà FE gửi message tới
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint FE kết nối (giữ nguyên URL cũ)
        registry.addEndpoint("/ws-battery")
                .setAllowedOrigins("*")
                .withSockJS();
    }
}
