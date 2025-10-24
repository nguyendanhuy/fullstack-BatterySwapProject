package BatterySwapStation.service;

import BatterySwapStation.entity.*;
import BatterySwapStation.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
public class SubscriptionService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private SubscriptionPlanRepository planRepository;
    @Autowired
    private UserSubscriptionRepository userSubscriptionRepository;
    @Autowired
    private InvoiceRepository invoiceRepository;
    @Autowired
    private SystemPriceService systemPriceService;
    @Autowired
    private SubscriptionPlanRepository subscriptionPlanRepository;
    /**
     * Hàm chính: Xử lý việc user đăng ký 1 gói cước.
     * Logic: Tạo 1 Invoice PENDING cho gói cước đó.
     *
     * @param userId ID của user đang mua
     * @param planId ID của gói cước (ví dụ: Gói Cơ bản)
     * @return Invoice mới được tạo (để user thanh toán)
     */
    @Transactional
    public Invoice createSubscriptionInvoice(String userId, Integer planId) {

        // --- 1. VALIDATION (Kiểm tra) ---

        // a. Tìm User
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy User ID: " + userId));

        // b. Tìm Gói cước
        SubscriptionPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Gói cước ID: " + planId));

        // c. KIỂM TRA QUAN TRỌNG: User này đã có gói ACTIVE chưa?
        Optional<UserSubscription> activeSub = userSubscriptionRepository.findActiveSubscriptionForUser(
                userId,
                UserSubscription.SubscriptionStatus.ACTIVE,
                LocalDateTime.now()
        );

        if (activeSub.isPresent()) {
            throw new IllegalStateException("Bạn đã có một gói cước đang hoạt động. " +
                    "Không thể đăng ký gói mới cho đến khi gói cũ hết hạn.");
        }

        // --- 2. LẤY GIÁ ---
        // Lấy giá từ SystemPrice (ví dụ: 299000.0)
        Double planPrice = systemPriceService.getPriceByType(plan.getPriceType());

        // --- 3. TẠO INVOICE ---
        Invoice invoice = new Invoice();
        invoice.setUserId(userId);
        invoice.setCreatedDate(LocalDateTime.now());
        invoice.setInvoiceStatus(Invoice.InvoiceStatus.PENDING);

        // Gán thông tin thanh toán cho Gói cước
        invoice.setTotalAmount(planPrice);
        invoice.setPricePerSwap(planPrice); // Ghi lại giá của gói
        invoice.setNumberOfSwaps(1); // Mua 1 gói

        // [QUAN TRỌNG] Liên kết Invoice này với Gói
        invoice.setPlanToActivate(plan);

        return invoiceRepository.save(invoice);
    }

    /**
     * [MỚI] Kích hoạt gói cước cho user sau khi thanh toán thành công.
     * Hàm này được gọi bởi PaymentService (hoặc nơi confirm payment).
     *
     * @param paidInvoice Hóa đơn (đã ở trạng thái PAID) mà user vừa thanh toán
     */
    @Transactional
    public UserSubscription activateSubscription(Invoice paidInvoice) {
        // 1. Kiểm tra invoice
        SubscriptionPlan plan = paidInvoice.getPlanToActivate();
        if (plan == null) {
            log.info("Invoice #{} không phải là invoice gói cước, bỏ qua.", paidInvoice.getInvoiceId());
            return null;
        }

        // 2. Lấy User
        User user = userRepository.findById(paidInvoice.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy User ID: " + paidInvoice.getUserId()));

        // 3. KIỂM TRA GÓI CƯỚC HIỆN TẠI
        Optional<UserSubscription> existingSubOpt = userSubscriptionRepository
                .findActiveSubscriptionForUser(
                        user.getUserId(),
                        UserSubscription.SubscriptionStatus.ACTIVE,
                        LocalDateTime.now()
                );

        if (existingSubOpt.isPresent()) {
            // --- LOGIC GIA HẠN (USER ĐÃ CÓ GÓI ACTIVE) ---
            UserSubscription existingSub = existingSubOpt.get();
            log.info("User {} đã có gói ACTIVE. Đang kiểm tra gia hạn...", user.getUserId());

            // Kiểm tra xem user có đang gia hạn đúng gói của họ không
            if (!existingSub.getPlan().getId().equals(plan.getId())) {
                log.warn("User {} đang ACTIVE Gói {} nhưng lại thanh toán cho Gói {}. Chặn kích hoạt.",
                        user.getUserId(), existingSub.getPlan().getPlanName(), plan.getPlanName());
                throw new IllegalStateException("Bạn đã có một gói cước đang hoạt động (" + existingSub.getPlan().getPlanName() + "). " +
                        "Không thể kích hoạt Gói " + plan.getPlanName() + " cùng lúc.");
            }

            // [LOGIC CỘNG DỒN] Cộng thêm ngày vào gói CŨ.
            LocalDateTime currentEndDate = existingSub.getEndDate();
            LocalDateTime newEndDate = currentEndDate.plusDays(plan.getDurationInDays()); // Lấy ngày hết hạn CŨ + 30 ngày

            existingSub.setEndDate(newEndDate);
            existingSub.setUsedSwaps(0); // Reset số lượt đã dùng về 0
            existingSub.setStatus(UserSubscription.SubscriptionStatus.ACTIVE); // Đảm bảo vẫn Active

            UserSubscription savedSubscription = userSubscriptionRepository.save(existingSub);
            log.info("Đã GIA HẠN thành công Gói {} cho User {}. Hạn mới: {}",
                    plan.getPlanName(),
                    user.getUserId(),
                    newEndDate);

            return savedSubscription;

        } else {
            // --- LOGIC KÍCH HOẠT MỚI (USER CHƯA CÓ GÓI) ---
            log.info("Kích hoạt Gói MỚI {} cho User {}", plan.getPlanName(), user.getUserId());

            LocalDateTime startTime = LocalDateTime.now();
            LocalDateTime endTime = startTime.plusDays(plan.getDurationInDays()); // + 30 ngày

            UserSubscription newSubscription = UserSubscription.builder()
                    .user(user)
                    .plan(plan)
                    .startDate(startTime)
                    .endDate(endTime)
                    .status(UserSubscription.SubscriptionStatus.ACTIVE)
                    .autoRenew(true)
                    .usedSwaps(0)
                    .build();

            UserSubscription savedSubscription = userSubscriptionRepository.save(newSubscription);
            log.info("Đã kích hoạt MỚI thành công Gói {} cho User {}",
                    plan.getPlanName(),
                    user.getUserId());

            return savedSubscription;
        }
    }

    /**
     * [MỚI] Tạo một Invoice PENDING để GIA HẠN
     * (Hàm này được gọi bởi Scheduler)
     */
    @Transactional
    public Invoice createRenewalInvoice(UserSubscription subscription) {

        SubscriptionPlan plan = subscription.getPlan();
        Double planPrice = systemPriceService.getPriceByType(plan.getPriceType());

        // [QUAN TRỌNG] Kiểm tra xem đã có invoice PENDING nào chưa
        // (Để tránh Scheduler tạo 10 invoice cho 1 lần gia hạn)
        boolean hasPendingInvoice = invoiceRepository.existsByUserIdAndPlanToActivateAndInvoiceStatus(
                subscription.getUser().getUserId(),
                plan,
                Invoice.InvoiceStatus.PENDING
        );

        if (hasPendingInvoice) {
            log.warn("User {} đã có Invoice PENDING cho gói {}, không tạo thêm.",
                    subscription.getUser().getUserId(), plan.getPlanName());
            return null; // Đã có, không tạo
        }

        // Tạo Invoice mới
        Invoice invoice = new Invoice();
        invoice.setUserId(subscription.getUser().getUserId());
        invoice.setCreatedDate(LocalDateTime.now());
        invoice.setInvoiceStatus(Invoice.InvoiceStatus.PENDING);

        invoice.setTotalAmount(planPrice);
        invoice.setPricePerSwap(planPrice); // Ghi lại giá của gói
        invoice.setNumberOfSwaps(1); // Mua 1 gói
        invoice.setPlanToActivate(plan); // Liên kết với Gói

        Invoice savedInvoice = invoiceRepository.save(invoice);
        log.info("Scheduler đã tạo Invoice #{} GIA HẠN cho User {}",
                savedInvoice.getInvoiceId(),
                subscription.getUser().getUserId());

        // (Bạn có thể thêm logic gửi Email/Thông báo cho user tại đây)

        return savedInvoice;
    }

    /**
     * [MỚI] Tắt tự động gia hạn (Hủy gói cước)
     * (Chỉ tắt autoRenew, gói cước vẫn dùng được đến hết hạn)
     */
    @Transactional
    public UserSubscription cancelSubscription(String userId) {
        UserSubscription activeSub = userSubscriptionRepository
                .findActiveSubscriptionForUser(
                        userId,
                        UserSubscription.SubscriptionStatus.ACTIVE,
                        LocalDateTime.now()
                ).orElseThrow(() ->
                        new EntityNotFoundException("Bạn không có gói cước nào đang hoạt động để hủy.")
                );

        if (!activeSub.isAutoRenew()) {
            throw new IllegalStateException("Gói cước của bạn đã được hủy (đã tắt tự động gia hạn) từ trước.");
        }

        // [LOGIC CHÍNH] Tắt tự động gia hạn
        activeSub.setAutoRenew(false);
        // (Chúng ta KHÔNG set status = CANCELLED, vì gói vẫn ACTIVE đến hết hạn)

        UserSubscription savedSub = userSubscriptionRepository.save(activeSub);
        log.info("User {} đã TẮT AUTO-RENEW cho Gói {}", userId, savedSub.getPlan().getPlanName());

        return savedSub;
    }


    /**
     * [MỚI] Lấy gói cước ĐANG HOẠT ĐỘNG (ACTIVE) của user.
     */
    public Map<String, Object> getActiveSubscription(String userId) {
        // (Chúng ta dùng lại hàm cũ)
        UserSubscription activeSub = userSubscriptionRepository
                .findActiveSubscriptionForUser(
                        userId,
                        UserSubscription.SubscriptionStatus.ACTIVE,
                        LocalDateTime.now()
                ).orElse(null); // Trả về null nếu không tìm thấy

        if (activeSub == null) {
            return null; // Không có gói nào đang active
        }

        return convertSubscriptionToMap(activeSub);
    }

    /**
     * [MỚI] Lấy TẤT CẢ lịch sử gói cước của user (active, expired, ...).
     */
    public List<Map<String, Object>> getSubscriptionHistory(String userId) {
        List<UserSubscription> allSubs = userSubscriptionRepository
                .findByUser_UserIdOrderByStartDateDesc(userId);

        return allSubs.stream()
                .map(this::convertSubscriptionToMap) // Chuyển đổi từng cái sang Map
                .collect(Collectors.toList());
    }

    /**
     * [MỚI] Hàm helper để chuyển đổi Entity sang Map DTO
     */
    private Map<String, Object> convertSubscriptionToMap(UserSubscription sub) {
        if (sub == null) {
            return null;
        }

        SubscriptionPlan plan = sub.getPlan();
        Double price = systemPriceService.getPriceByType(plan.getPriceType());

        // Lấy giới hạn (limit)
        Integer limit = plan.getSwapLimit();
        String limitStr = "Không giới hạn";
        if (limit != null && limit >= 0) {
            limitStr = String.valueOf(limit);
        }

        return Map.of(
                "userSubscriptionId", sub.getId(),
                "status", sub.getStatus().name(),
                "autoRenew", sub.isAutoRenew(),
                "startDate", sub.getStartDate(),
                "endDate", sub.getEndDate(),
                "usedSwaps", sub.getUsedSwaps(),
                "plan", Map.of(
                        "planId", plan.getId(),
                        "planName", plan.getPlanName(),
                        "description", plan.getDescription(),
                        "durationInDays", plan.getDurationInDays(),
                        "swapLimit", limitStr, // Trả về "10" hoặc "Không giới hạn"
                        "price", price
                )
        );
    }

    // (Bên trong SubscriptionService.java)
// (Cần import java.util.stream.Collectors)

    /**
     * [MỚI] Lấy tất cả các gói SubscriptionPlan có sẵn.
     */
    public List<Map<String, Object>> getAllSubscriptionPlans() {

        List<SubscriptionPlan> allPlans = subscriptionPlanRepository.findAll();

        return allPlans.stream()
                .map(plan -> {
                    Double price = systemPriceService.getPriceByType(plan.getPriceType());

                    Integer limit = plan.getSwapLimit();
                    String limitStr = "Không giới hạn";
                    if (limit != null && limit >= 0) {
                        limitStr = String.valueOf(limit);
                    }

                    // ✅ [SỬA LỖI] Dùng HashMap thay vì Map.of()
                    Map<String, Object> planMap = new HashMap<>();
                    planMap.put("planId", plan.getId());
                    planMap.put("planName", plan.getPlanName());
                    planMap.put("description", plan.getDescription());
                    planMap.put("price", price);
                    planMap.put("priceType", plan.getPriceType().name());
                    planMap.put("durationInDays", plan.getDurationInDays());
                    planMap.put("swapLimit", limitStr);
                    planMap.put("swapLimitInt", limit);

                    return planMap; // Trả về HashMap
                })
                .collect(Collectors.toList()); // Lỗi sẽ hết
    }



}