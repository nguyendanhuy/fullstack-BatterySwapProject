package BatterySwapStation.repository;

import BatterySwapStation.entity.BatteryRebalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BatteryRebalanceRepository extends JpaRepository<BatteryRebalance, Long> {

    // Lấy danh sách lệnh điều phối theo trạng thái
    List<BatteryRebalance> findByStatus(BatteryRebalance.RebalanceStatus status);
}
