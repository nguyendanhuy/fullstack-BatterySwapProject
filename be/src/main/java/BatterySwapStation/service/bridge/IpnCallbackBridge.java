package BatterySwapStation.service.bridge;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
public class IpnCallbackBridge {

    private static final String LOCAL_CALLBACK_URL = "http://localhost:8080/api/internal/vnpay/ipn-sync";

    @Async
    public void sendLocalCallback(Map<String, Object> payload) {
        try {
            log.info("📨 [CALLBACK] Gửi dữ liệu IPN về local BE: {}", LOCAL_CALLBACK_URL);

            RestTemplate rest = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            ResponseEntity<String> resp = rest.postForEntity(LOCAL_CALLBACK_URL, entity, String.class);

            log.info("✅ [CALLBACK] Gửi thành công → status={}, body={}",
                    resp.getStatusCode(), resp.getBody());

        } catch (Exception e) {
            log.error("❌ [CALLBACK] Lỗi gửi về local BE: {}", e.getMessage());
        }
    }
}
