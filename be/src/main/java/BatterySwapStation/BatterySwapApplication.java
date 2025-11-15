package BatterySwapStation;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class BatterySwapApplication {
    public static void main(String[] args) {

        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        SpringApplication.run(BatterySwapApplication.class, args);
    }

    @PostConstruct
    public void init() {
        System.out.println(">>> JVM Zone: " + TimeZone.getDefault());
        System.out.println(">>> LocalDateTime: " + LocalDateTime.now());
        System.out.println(">>> ZonedDateTime: " + ZonedDateTime.now());
    }
}