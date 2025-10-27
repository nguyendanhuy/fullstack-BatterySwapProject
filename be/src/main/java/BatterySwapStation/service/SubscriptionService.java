package BatterySwapStation.service;

import BatterySwapStation.dto.SubscriptionRequest;
import BatterySwapStation.entity.*;
import BatterySwapStation.repository.*;
import lombok.RequiredArgsConstructor; // ✅ [THÊM MỚI]
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
@RequiredArgsConstructor // ✅ [SỬA 1] Dùng Constructor Injection
public class SubscriptionService {


    private final UserRepository userRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final InvoiceRepository invoiceRepository;
    private final SystemPriceService systemPriceService;
    private final SubscriptionPlanRepository subscriptionPlanRepository; // Giữ lại tên đầy đủ

    /**
     * ✅ [SỬA 2] Cập nhật hàm này để dùng DTO (SubscribeRequest)
     * và giữ lại logic kiểm tra "activeSub"
     */
    @Transactional
    public Invoice createSubscriptionInvoice(SubscriptionRequest request) {

        // --- 1. VALIDATION (Kiểm tra) ---

        // a. Tìm User
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy User ID: " + request.getUserId()));

        // b. Tìm Gói cước
        SubscriptionPlan plan = subscriptionPlanRepository.findById(request.getPlanId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Gói cước ID: " + request.getPlanId()));

        // c. KIỂM TRA QUAN TRỌNG: User này đã có gói ACTIVE chưa?
        Optional<UserSubscription> activeSub = userSubscriptionRepository.findActiveSubscriptionForUser(
                request.getUserId(),
                UserSubscription.SubscriptionStatus.ACTIVE,
                LocalDateTime.now()
        );

        if (activeSub.isPresent()) {
            throw new IllegalStateException("Bạn đã có một gói cước đang hoạt động. " +
                    "Không thể đăng ký gói mới cho đến khi gói cũ hết hạn.");
        }

        // --- 2. LẤY GIÁ ---
        Double planPrice = systemPriceService.getPriceByType(plan.getPriceType());
        if (planPrice == null) {
            throw new EntityNotFoundException("Không tìm thấy giá cho " + plan.getPriceType());
        }

        // --- 3. TẠO INVOICE (Khớp với Entity Invoice của bạn) ---
        Invoice invoice = new Invoice();
        invoice.setUserId(user.getUserId());
        invoice.setCreatedDate(LocalDateTime.now());
        invoice.setInvoiceStatus(Invoice.InvoiceStatus.PENDING);
        invoice.setTotalAmount(planPrice);
        invoice.setPlanToActivate(plan); // [QUAN TRỌNG] Liên kết Invoice với Gói
        invoice.setNumberOfSwaps(0); // Không phải batch booking

        return invoiceRepository.save(invoice);
    }

    /**
     * Kích hoạt gói cước sau khi thanh toán thành công.
     * (Giữ nguyên logic mới của bạn)
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

            if (!existingSub.getPlan().getId().equals(plan.getId())) {
                log.warn("User {} đang ACTIVE Gói {} nhưng lại thanh toán cho Gói {}. Chặn kích hoạt.",
                        user.getUserId(), existingSub.getPlan().getPlanName(), plan.getPlanName());
                throw new IllegalStateException("Bạn đã có một gói cước đang hoạt động (" + existingSub.getPlan().getPlanName() + "). " +
                        "Không thể kích hoạt Gói " + plan.getPlanName() + " cùng lúc.");
            }

            LocalDateTime currentEndDate = existingSub.getEndDate();
            LocalDateTime newEndDate = currentEndDate.plusDays(plan.getDurationInDays());

            existingSub.setEndDate(newEndDate);
            existingSub.setUsedSwaps(0);
            existingSub.setStatus(UserSubscription.SubscriptionStatus.ACTIVE);

            UserSubscription savedSubscription = userSubscriptionRepository.save(existingSub);
            log.info("Đã GIA HẠN thành công Gói {} cho User {}. Hạn mới: {}",
                    plan.getPlanName(), user.getUserId(), newEndDate);
            return savedSubscription;

        } else {
            // --- LOGIC KÍCH HOẠT MỚI (USER CHƯA CÓ GÓI) ---
            log.info("Kích hoạt Gói MỚI {} cho User {}", plan.getPlanName(), user.getUserId());

            LocalDateTime startTime = LocalDateTime.now();
            LocalDateTime endTime = startTime.plusDays(plan.getDurationInDays());

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
                    plan.getPlanName(), user.getUserId());
            return savedSubscription;
        }
    }

    /**
     * Tạo một Invoice PENDING để GIA HẠN
     * (Giữ nguyên logic mới của bạn)
     */
    @Transactional
    public Invoice createRenewalInvoice(UserSubscription subscription) {

        SubscriptionPlan plan = subscription.getPlan();
        Double planPrice = systemPriceService.getPriceByType(plan.getPriceType());

        // Kiểm tra xem đã có invoice PENDING nào chưa
        boolean hasPendingInvoice = invoiceRepository.existsByUserIdAndPlanToActivateAndInvoiceStatus(
                subscription.getUser().getUserId(),
                plan,
                Invoice.InvoiceStatus.PENDING
        );
        // (Lưu ý: Bạn cần thêm hàm `existsByUserIdAndPlanToActivateAndInvoiceStatus` vào InvoiceRepository)

        if (hasPendingInvoice) {
            log.warn("User {} đã có Invoice PENDING cho gói {}, không tạo thêm.",
                    subscription.getUser().getUserId(), plan.getPlanName());
            return null;
        }

        // Tạo Invoice mới
        Invoice invoice = new Invoice();
        invoice.setUserId(subscription.getUser().getUserId());
        invoice.setCreatedDate(LocalDateTime.now());
        invoice.setInvoiceStatus(Invoice.InvoiceStatus.PENDING);
        invoice.setTotalAmount(planPrice);
        invoice.setPricePerSwap(planPrice);
        invoice.setNumberOfSwaps(1);
        invoice.setPlanToActivate(plan);

        Invoice savedInvoice = invoiceRepository.save(invoice);
        log.info("Scheduler đã tạo Invoice #{} GIA HẠN cho User {}",
                savedInvoice.getInvoiceId(), subscription.getUser().getUserId());
        return savedInvoice;
    }

    /**
     * Tắt tự động gia hạn (Hủy gói cước)
     * (Giữ nguyên logic mới của bạn)
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

        activeSub.setAutoRenew(false);
        UserSubscription savedSub = userSubscriptionRepository.save(activeSub);
        log.info("User {} đã TẮT AUTO-RENEW cho Gói {}", userId, savedSub.getPlan().getPlanName());
        return savedSub;
    }


    /**
     * Lấy gói cước ĐANG HOẠT ĐỘNG (ACTIVE) của user.
     * (Giữ nguyên)
     */
    public Map<String, Object> getActiveSubscription(String userId) {
        UserSubscription activeSub = userSubscriptionRepository
                .findActiveSubscriptionForUser(
                        userId,
                        UserSubscription.SubscriptionStatus.ACTIVE,
                        LocalDateTime.now()
                ).orElse(null);

        if (activeSub == null) {
            return null;
        }
        return convertSubscriptionToMap(activeSub);
    }

    /**
     * Lấy TẤT CẢ lịch sử gói cước của user.
     * (Giữ nguyên)
     */
    public List<Map<String, Object>> getSubscriptionHistory(String userId) {
        List<UserSubscription> allSubs = userSubscriptionRepository
                .findByUser_UserIdOrderByStartDateDesc(userId);

        return allSubs.stream()
                .map(this::convertSubscriptionToMap)
                .collect(Collectors.toList());
    }

    /**
     * ✅ [SỬA 3] Hàm helper, đổi Map.of() sang HashMap
     */
    private Map<String, Object> convertSubscriptionToMap(UserSubscription sub) {
        if (sub == null) {
            return null;
        }

        SubscriptionPlan plan = sub.getPlan();
        Double price = systemPriceService.getPriceByType(plan.getPriceType());

        Integer limit = plan.getSwapLimit();
        String limitStr = "Không giới hạn";
        if (limit != null && limit >= 0) {
            limitStr = String.valueOf(limit);
        }

        // Dùng HashMap để tránh NullPointerException
        Map<String, Object> map = new HashMap<>();
        map.put("userSubscriptionId", sub.getId());
        map.put("status", sub.getStatus().name());
        map.put("autoRenew", sub.isAutoRenew());
        map.put("startDate", sub.getStartDate());
        map.put("endDate", sub.getEndDate());
        map.put("usedSwaps", sub.getUsedSwaps());

        Map<String, Object> planMap = new HashMap<>();
        planMap.put("planId", plan.getId());
        planMap.put("planName", plan.getPlanName());
        planMap.put("description", plan.getDescription());
        planMap.put("durationInDays", plan.getDurationInDays());
        planMap.put("swapLimit", limitStr);
        planMap.put("price", price);

        map.put("plan", planMap);
        return map;
    }

    /**
     * Lấy tất cả các gói SubscriptionPlan có sẵn.
     * (Giữ nguyên, phiên bản này đã đúng)
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

                    Map<String, Object> planMap = new HashMap<>();
                    planMap.put("planId", plan.getId());
                    planMap.put("planName", plan.getPlanName());
                    planMap.put("description", plan.getDescription());
                    planMap.put("price", price);
                    planMap.put("priceType", plan.getPriceType().name());
                    planMap.put("durationInDays", plan.getDurationInDays());
                    planMap.put("swapLimit", limitStr);
                    planMap.put("swapLimitInt", limit);

                    return planMap;
                })
                .collect(Collectors.toList());
    }
}