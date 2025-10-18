package BatterySwapStation.repository;

import BatterySwapStation.entity.StaffAssign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StaffAssignRepository extends JpaRepository<StaffAssign, Integer> {

    // Kiểm tra staff được phân công tại trạm cụ thể không
    boolean existsByUser_UserIdAndStationIdAndIsActiveTrue(String userId, int stationId);
}
