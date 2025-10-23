package BatterySwapStation.config;


import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "vnpay")
public class VnPayProperties {
    private String tmnCode;
    private String hashSecret;
    private String payUrl;
    private String apiVersion;
    private String command;
    private String currCode;
    private String locale;
    private String timezone;
    private Integer expireMinutes;
    private String returnUrl;
    private String ipnUrl;
    private String refundUrl;
}
