package BatterySwapStation.repository;

import BatterySwapStation.entity.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Integer> {

    /**
     * [MỚI] Tìm gói cước đang ACTIVE của một user cụ thể.
     */
    @Query("SELECT us FROM UserSubscription us " +
            "WHERE us.user.userId = :userId " +
            "AND us.status = :status " +
            "AND us.endDate > :now")
    Optional<UserSubscription> findActiveSubscriptionForUser(
            @Param("userId") String userId,
            @Param("status") UserSubscription.SubscriptionStatus status,
            @Param("now") LocalDateTime now
    );

    /**
     * [MỚI] Tìm các gói ACTIVE, có BẬT autoRenew,
     * và sẽ hết hạn trong vòng 'daysRemaining' ngày tới.
     */
    @Query("SELECT us FROM UserSubscription us " +
            "WHERE us.status = 'ACTIVE' " + // Chỉ gói đang active
            "AND us.autoRenew = true " +   // Chỉ gói bật tự động gia hạn
            "AND us.endDate BETWEEN :now AND :futureDate") // Hết hạn trong khoảng (ví dụ: 3 ngày tới)
    List<UserSubscription> findSubscriptionsNearingExpiry(
            @Param("now") LocalDateTime now,
            @Param("futureDate") LocalDateTime futureDate
    );

    /**
     * * [MỚI] Tìm TẤT CẢ các gói cước (cả active, expired, cancelled)
     *      * của một user, sắp xếp theo ngày bắt đầu mới nhất.
     *
     */

    List<UserSubscription> findByUser_UserIdOrderByStartDateDesc(String userId);
    UserSubscription findFirstByUser_UserIdAndStatusAndEndDateAfter(
            String userId, UserSubscription.SubscriptionStatus status, LocalDateTime now);
}

