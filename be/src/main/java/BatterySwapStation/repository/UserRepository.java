package BatterySwapStation.repository;

import BatterySwapStation.dto.StaffListItemDTO;
import BatterySwapStation.entity.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import BatterySwapStation.entity.User;

import java.util.List;


@Repository
public interface UserRepository extends JpaRepository<User, String> {
    User findByEmail(String email);
    boolean existsByEmail(String email);
    long countByRole_RoleId(int roleId);

    boolean existsByPhone(String phone);
    @Query("""
    SELECT new BatterySwapStation.dto.StaffListItemDTO(
        u.userId,
        u.fullName,
        u.email,
        sa.stationId,
        s.stationName,
        u.isActive
    )
    FROM User u
    LEFT JOIN StaffAssign sa ON sa.user.userId = u.userId AND sa.isActive = true
    LEFT JOIN Station s ON s.stationId = sa.stationId
    WHERE u.role.roleId = 2
    ORDER BY u.userId
""")
    List<StaffListItemDTO> findAllStaffWithStation();
    @Query("""
    SELECT new BatterySwapStation.dto.StaffListItemDTO(
        u.userId,
        u.fullName,
        u.email,
        sa.stationId,
        s.stationName,
        u.isActive
    )
    FROM User u
    LEFT JOIN StaffAssign sa ON sa.user.userId = u.userId AND sa.isActive = true
    LEFT JOIN Station s ON s.stationId = sa.stationId
    WHERE u.role.roleId = 2 AND s.stationId = :stationId
    ORDER BY u.userId
""")
    List<StaffListItemDTO> findStaffByStationId(Integer stationId);

    @Query("""
    SELECT us FROM UserSubscription us 
    WHERE us.user.userId = :userId 
      AND us.status = 'ACTIVE'
      AND us.endDate > CURRENT_TIMESTAMP 
    ORDER BY us.startDate DESC
""")
    List<UserSubscription> findActiveSubscriptions(@Param("userId") String userId);

}