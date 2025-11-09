package BatterySwapStation.service;

import BatterySwapStation.entity.UserSubscription;
import BatterySwapStation.repository.UserSubscriptionRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
public class SubscriptionSchedulerService {

    @Autowired
    private UserSubscriptionRepository userSubscriptionRepository;

    @Autowired
    private SubscriptionService subscriptionService;

    // Số ngày báo trước để tạo invoice gia hạn
    private static final int RENEWAL_NOTICE_DAYS = 3;
    /**
     * Chạy vào 1:05 AM mỗi ngày
     * (Tìm các gói sắp hết hạn và tạo invoice gia hạn)
     */
    @Scheduled(cron = "0 5 1 * * ?") // (Giây Phút Giờ Ngày Tháng NgàyTrongTuần)
    public void processAutoRenewals() {
        log.info("--- [Scheduler] Bắt đầu quét gia hạn gói cước ---");

        LocalDateTime now = LocalDateTime.now();
        // Tìm các gói hết hạn từ BÂY GIỜ đến 3 NGÀY TỚI
        LocalDateTime expiryLimit = now.plusDays(RENEWAL_NOTICE_DAYS);

        List<UserSubscription> subscriptionsToRenew = userSubscriptionRepository
                .findSubscriptionsNearingExpiry(now, expiryLimit);

        log.info("[Scheduler] Tìm thấy {} gói cước sắp hết hạn cần tạo invoice.",
                subscriptionsToRenew.size());

        for (UserSubscription sub : subscriptionsToRenew) {
            try {
                // Gọi service để tạo invoice PENDING
                subscriptionService.createRenewalInvoice(sub);
            } catch (Exception e) {
                log.error("[Scheduler] Lỗi khi tạo invoice gia hạn cho Sub ID {}: {}",
                        sub.getId(), e.getMessage());
            }
        }
        log.info("--- [Scheduler] Kết thúc quét gia hạn ---");
    }
}