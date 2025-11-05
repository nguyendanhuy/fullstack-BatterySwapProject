package BatterySwapStation.config; // Thay thế bằng package của bạn

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration // Đánh dấu đây là lớp cấu hình Spring
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // Áp dụng cho TẤT CẢ các đường dẫn API (/**)
                .allowedOrigins("http://localhost:5173") // CHỈ cho phép nguồn gốc này
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH") // Cho phép các phương thức này
                .allowedHeaders("*") // Cho phép tất cả các loại header
                .allowCredentials(true) // Cho phép gửi Cookie, Authorization Header (Rất quan trọng cho JWT)
                .maxAge(3600); // Thời gian cache kết quả CORS pre-flight request
    }
}