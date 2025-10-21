package BatterySwapStation.repository;

import BatterySwapStation.entity.StaffAssign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StaffAssignRepository extends JpaRepository<StaffAssign, Integer> {
    boolean existsByStationIdAndUser_UserId(Integer stationId, String userId);
}
