package BatterySwapStation.repository;

import BatterySwapStation.entity.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Integer> {

    /**
     * ✅ [SỬA LỖI LOGIC]
     * Sửa câu query để tìm gói cước ACTIVE
     * (Một gói ACTIVE là khi: status=ACTIVE VÀ 'now' Ở GIỮA 'startDate' và 'endDate')
     */
    @Query("SELECT us FROM UserSubscription us " +
            "WHERE us.user.userId = :userId " +
            "AND us.status = :status " +
            "AND us.startDate <= :now " +  // <-- [SỬA DÒNG NÀY]
            "AND us.endDate >= :now")      // <-- [SỬA DÒNG NÀY]
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

    // ✅ [THÊM MỚI]
    // Hàm này dùng ngày cụ thể - dùng cho API GET (lấy booking cũ)
    @Query("SELECT us FROM UserSubscription us " +
            "WHERE us.user.userId = :userId " +
            "AND us.status = :status " +
            "AND us.startDate <= :checkDate " +  // <-- Dùng ngày được cung cấp
            "AND us.endDate >= :checkDate")      // <-- Dùng ngày được cung cấp
    Optional<UserSubscription> findActiveSubscriptionForUserOnDate(
            @Param("userId") String userId,
            @Param("status") UserSubscription.SubscriptionStatus status,
            @Param("checkDate") LocalDateTime checkDate
    );

    /**
     * Tìm gói cước ACTIVE của user (hiện tại)
     * Wrapper đơn giản cho findActiveSubscriptionForUser
     */
    default Optional<UserSubscription> findActiveSubscription(String userId) {
        return findActiveSubscriptionForUser(
            userId,
            UserSubscription.SubscriptionStatus.ACTIVE,
            LocalDateTime.now()
        );
    }
    @Query("""
    SELECT us FROM UserSubscription us 
    WHERE us.user.userId = :userId 
      AND us.status = 'ACTIVE'
      AND us.endDate > CURRENT_TIMESTAMP 
    ORDER BY us.startDate DESC
""")
    List<UserSubscription> findActiveSubscriptions(@Param("userId") String userId);
    @Query("""
SELECT new map(
    us.id as id,
    us.startDate as startDate,
    us.endDate as endDate,
    us.usedSwaps as usedSwaps,
    us.autoRenew as autoRenew,
    p.id as planId,
    p.planName as planName,
    p.description as description,
    p.swapLimit as swapLimit,
    p.durationInDays as durationInDays,
    p.priceType as priceType
)
FROM UserSubscription us
JOIN us.plan p
WHERE us.user.userId = :userId
  AND us.status = 'ACTIVE'
  AND us.startDate <= CURRENT_TIMESTAMP
  AND us.endDate >= CURRENT_TIMESTAMP
ORDER BY us.startDate DESC
""")
    List<Map<String, Object>> findActiveSubscriptionSimple(@Param("userId") String userId);


    @Query("""
SELECT new map(
    us.id AS id,
    us.startDate AS startDate,
    us.endDate AS endDate,
    us.usedSwaps AS usedSwaps,
    us.status AS status,
    us.autoRenew AS autoRenew,
    p.id AS planId,
    p.planName AS planName,
    p.description AS description,
    p.durationInDays AS durationInDays,
    p.swapLimit AS swapLimit,
    p.priceType AS priceType
)
FROM UserSubscription us
JOIN us.plan p
WHERE us.user.userId = :userId
ORDER BY us.startDate DESC
""")
    List<Map<String, Object>> findSubscriptionHistorySimple(@Param("userId") String userId);

}