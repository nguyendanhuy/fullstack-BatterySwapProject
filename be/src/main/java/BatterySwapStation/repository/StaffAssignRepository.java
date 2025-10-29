package BatterySwapStation.repository;

import BatterySwapStation.dto.StaffListItemDTO;
import BatterySwapStation.entity.StaffAssign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StaffAssignRepository extends JpaRepository<StaffAssign, Integer> {
    boolean existsByStationIdAndUser_UserId(Integer stationId, String userId);
    StaffAssign findFirstByUser_UserIdAndIsActiveTrue(String userId);

    @Query("""
    SELECT new BatterySwapStation.dto.StaffListItemDTO(
        u.userId, u.fullName, u.email,
        sa.stationId, s.stationName, u.isActive
    )
    FROM User u
    LEFT JOIN StaffAssign sa ON sa.user.userId = u.userId AND sa.isActive = true
    LEFT JOIN Station s ON s.stationId = sa.stationId
    WHERE u.role.roleId = 2
""")
    List<StaffListItemDTO> findAllStaffWithStation();

}

