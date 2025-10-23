package BatterySwapStation.service;

import BatterySwapStation.entity.Battery;
import BatterySwapStation.repository.BatteryRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BatteryService {

    private final BatteryRepository batteryRepository;
    @Scheduled(fixedRate = 60000) // 1 phút
    @Transactional
    public void autoChargeBatteries() {
        List<Battery> chargingBatteries = batteryRepository.findByBatteryStatus(Battery.BatteryStatus.CHARGING);

        for (Battery battery : chargingBatteries) {
            double current = battery.getCurrentCapacity() == null ? 0.0 : battery.getCurrentCapacity();
            current += 10.0; // tăng 10% mỗi phút

            if (current >= 100.0) {
                current = 100.0;
                battery.setBatteryStatus(Battery.BatteryStatus.AVAILABLE);
            }

            battery.setCurrentCapacity(current);
            batteryRepository.save(battery);
        }
    }


}
