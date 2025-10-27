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
     * ✅ [SỬA LỖI LOGIC]
     * Sửa câu query để tìm gói cước ACTIVE
     * (Một gói ACTIVE là khi: status=ACTIVE VÀ now Ở GIỮA startDate và endDate)
     */
    @Query("SELECT us FROM UserSubscription us " +
            "WHERE us.user.userId = :userId " +
            "AND us.status = :status " +
            "AND us.startDate <= :now " +  // <-- [THÊM DÒNG NÀY]
            "AND us.endDate >= :now")      // <-- [SỬA DÒNG NÀY] (dùng >=)
    Optional<UserSubscription> findActiveSubscriptionForUser(
            @Param("userId") String userId,
            @Param("status") UserSubscription.SubscriptionStatus status,
            @Param("now") LocalDateTime now
    );

    /**
     * [MỚI] Tìm các gói ACTIVE, có BẬT autoRenew,
     * và sẽ hết hạn trong vòng 'daysRemaining' ngày tới.
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
     * [MỚI] Tìm TẤT CẢ các gói cước
     * (Giữ nguyên)
     */
    List<UserSubscription> findByUser_UserIdOrderByStartDateDesc(String userId);

    // (Hàm này có thể bị trùng lặp logic với hàm @Query, nhưng cứ giữ lại)
    UserSubscription findFirstByUser_UserIdAndStatusAndEndDateAfter(
            String userId, UserSubscription.SubscriptionStatus status, LocalDateTime now);
}