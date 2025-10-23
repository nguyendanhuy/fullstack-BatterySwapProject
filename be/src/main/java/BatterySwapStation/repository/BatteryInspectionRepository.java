package BatterySwapStation.repository;

import BatterySwapStation.entity.BatteryInspection;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BatteryInspectionRepository extends JpaRepository<BatteryInspection, Long> {
}
