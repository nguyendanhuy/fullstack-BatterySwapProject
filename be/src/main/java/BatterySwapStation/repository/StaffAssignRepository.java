package BatterySwapStation.repository;

import BatterySwapStation.dto.StaffListItemDTO;
import BatterySwapStation.entity.StaffAssign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StaffAssignRepository extends JpaRepository<StaffAssign, Integer> {
    boolean existsByStationIdAndUser_UserId(Integer stationId, String userId);
    StaffAssign findFirstByUser_UserIdAndIsActiveTrue(String userId);

    @Query("""
SELECT new BatterySwapStation.dto.StaffListItemDTO(
    u.userId,
    u.fullName,
    u.email,
    sa.stationId,
    s.stationName,
    COALESCE(sa.isActive, false)
)
FROM User u
LEFT JOIN StaffAssign sa ON sa.user.userId = u.userId
    AND sa.assignDate = (
        SELECT MAX(sa2.assignDate)
        FROM StaffAssign sa2
        WHERE sa2.user.userId = u.userId
    )
LEFT JOIN Station s ON s.stationId = sa.stationId
WHERE u.role.roleId = 2
ORDER BY u.userId
""")
    List<StaffListItemDTO> findAllStaffWithStation();


    @Query("""
    SELECT CASE WHEN COUNT(sa) > 0 THEN true ELSE false END
    FROM StaffAssign sa
    WHERE sa.stationId = :stationId
      AND sa.user.userId = :userId
      AND sa.isActive = true
      AND sa.assignDate = (
          SELECT MAX(sa2.assignDate)
          FROM StaffAssign sa2
          WHERE sa2.user.userId = :userId
      )
""")
    boolean existsActiveAssign(@Param("stationId") Integer stationId,
                               @Param("userId") String userId);

    List<StaffAssign> findAllByUser_UserId(String userId);

}

