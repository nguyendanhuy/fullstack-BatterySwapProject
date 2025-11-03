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

}