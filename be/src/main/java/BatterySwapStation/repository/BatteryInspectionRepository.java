package BatterySwapStation.repository;

import BatterySwapStation.entity.BatteryInspection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BatteryInspectionRepository extends JpaRepository<BatteryInspection, Long> {
    List<BatteryInspection> findAllByOrderByInspectionTimeDesc();

    // Tìm tất cả các BatteryInspection theo Staff ID
    List<BatteryInspection> findByStaffUserId(String staffId);
}
