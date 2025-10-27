package BatterySwapStation.repository;

import BatterySwapStation.entity.Invoice; // (Thêm import này)
import BatterySwapStation.entity.SubscriptionPlan; // (Thêm import này)
import BatterySwapStation.entity.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Integer> {

    /**
     * ✅ [SỬA LỖI LOGIC]
     * (Giữ nguyên query này, nó đã đúng)
     */
    @Query("SELECT us FROM UserSubscription us " +
            "WHERE us.user.userId = :userId " +
            "AND us.status = :status " +
            "AND us.startDate <= :now " +
            "AND us.endDate >= :now")
    Optional<UserSubscription> findActiveSubscriptionForUser(
            @Param("userId") String userId,
            @Param("status") UserSubscription.SubscriptionStatus status,
            @Param("now") LocalDateTime now
    );

    /**
     * Tìm các gói ACTIVE, có BẬT autoRenew...
     * (Giữ nguyên)
     */
    @Query("SELECT us FROM UserSubscription us " +
            "WHERE us.status = 'ACTIVE' " +
            "AND us.autoRenew = true " +
            "AND us.endDate BETWEEN :now AND :futureDate")
    List<UserSubscription> findSubscriptionsNearingExpiry(
            @Param("now") LocalDateTime now,
            @Param("futureDate") LocalDateTime futureDate
    );

    /**
     * Tìm TẤT CẢ các gói cước
     * (Giữ nguyên)
     */
    List<UserSubscription> findByUser_UserIdOrderByStartDateDesc(String userId);

    UserSubscription findFirstByUser_UserIdAndStatusAndEndDateAfter(
            String userId, UserSubscription.SubscriptionStatus status, LocalDateTime now);

}