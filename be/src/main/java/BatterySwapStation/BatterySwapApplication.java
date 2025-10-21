package BatterySwapStation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BatterySwapApplication {
    public static void main(String[] args) {
        SpringApplication.run(BatterySwapApplication.class, args);
    }
}