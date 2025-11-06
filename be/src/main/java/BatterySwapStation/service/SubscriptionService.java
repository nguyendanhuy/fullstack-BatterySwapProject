package BatterySwapStation.service;

import BatterySwapStation.dto.SubscriptionRequest;
import BatterySwapStation.dto.UseSwapRequest;
import BatterySwapStation.entity.*;
import BatterySwapStation.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import jakarta.persistence.EntityNotFoundException;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class SubscriptionService {


    private final UserRepository userRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final InvoiceRepository invoiceRepository;
    private final SystemPriceService systemPriceService;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final BookingRepository bookingRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final PaymentRepository paymentRepository;



    @Transactional
    public Invoice createSubscriptionInvoice(SubscriptionRequest request) {

        // --- 1️⃣ VALIDATION ---
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy User ID: " + request.getUserId()));

        SubscriptionPlan plan = subscriptionPlanRepository.findById(request.getPlanId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Gói cước ID: " + request.getPlanId()));

        // Kiểm tra gói đang active
        Optional<UserSubscription> activeSub = userSubscriptionRepository.findActiveSubscriptionForUser(
                request.getUserId(),
                UserSubscription.SubscriptionStatus.ACTIVE,
                LocalDateTime.now()
        );

        if (activeSub.isPresent()) {
            throw new IllegalStateException("Bạn đã có một gói cước đang hoạt động. " +
                    "Không thể đăng ký gói mới cho đến khi gói cũ hết hạn.");
        }

        // --- 2️⃣ LẤY GIÁ ---
        Double planPrice = systemPriceService.getPriceByType(plan.getPriceType());
        if (planPrice == null) {
            throw new EntityNotFoundException("Không tìm thấy giá cho " + plan.getPriceType());
        }

        // --- 3️⃣ KHỞI TẠO INVOICE ---
        Invoice invoice = new Invoice();
        invoice.setUserId(user.getUserId());
        invoice.setCreatedDate(LocalDateTime.now());
        invoice.setPlanToActivate(plan);
        invoice.setNumberOfSwaps(0);
        invoice.setInvoiceType(Invoice.InvoiceType.SUBSCRIPTION);

        // --- 4️⃣ XỬ LÝ THANH TOÁN ---
        String method = request.getPaymentMethod(); // "WALLET" hoặc "VNPAY"
        if (method == null || method.isBlank()) {
            throw new IllegalArgumentException("Phương thức thanh toán là bắt buộc (WALLET hoặc VNPAY).");
        }

        if (method.equalsIgnoreCase("WALLET")) {
            // 🟢 THANH TOÁN QUA VÍ
            Double balance = Optional.ofNullable(user.getWalletBalance()).orElse(0.0);

            // 🛡️ KIỂM TRA VÍ BỊ OVERFLOW - KHÔNG RESET MÀ TỪ CHỐI GIAO DỊCH
            if (balance > 1_000_000_000) { // 1 tỉ VNĐ
                log.error("🚨 [WALLET ERROR] Phát hiện ví bị overflow: balance={} cho user {}", balance, user.getUserId());
                throw new IllegalStateException(String.format(
                        "Ví của bạn hiện có vấn đề (số dư: %.0f VNĐ vượt quá giới hạn bình thường). " +
                                "Vui lòng liên hệ hỗ trợ để khắc phục trước khi thực hiện giao dịch.",
                        balance
                ));
            }

            if (balance < planPrice) {
                throw new IllegalStateException(String.format(
                        "Số dư ví không đủ để mua gói %s. Cần: %.0f, Hiện có: %.0f",
                        plan.getPlanName(), planPrice, balance
                ));
            }

            // Trừ tiền ví
            double newBalance = balance - planPrice;
            if (newBalance < 0) {
                throw new IllegalStateException("Số dư ví sau giao dịch không thể âm");
            }

            user.setWalletBalance(newBalance);
            userRepository.save(user);

            // Đánh dấu invoice đã thanh toán
            invoice.setInvoiceStatus(Invoice.InvoiceStatus.PAID);
            invoice.setTotalAmount(planPrice);
            Invoice savedInvoice = invoiceRepository.save(invoice);

            // Ghi lại payment thành công (WALLET)
            Payment payment = Payment.builder()
                    .invoice(savedInvoice)
                    .amount(planPrice)
                    .paymentMethod(Payment.PaymentMethod.WALLET)
                    .paymentStatus(Payment.PaymentStatus.SUCCESS)
                    .transactionType(Payment.TransactionType.PAYMENT)
                    .message("Thanh toán gói cước " + plan.getPlanName() + " bằng ví người dùng.")
                    .createdAt(LocalDateTime.now())
                    .build();
            paymentRepository.save(payment);

            // Kích hoạt gói luôn sau khi trừ ví
            log.info("✅ [SUBSCRIPTION WALLET] User {} mua gói {} bằng ví thành công.", user.getUserId(), plan.getPlanName());
            this.activateSubscription(savedInvoice);
            return savedInvoice;

        } else if (method.equalsIgnoreCase("VNPAY")) {
            // 🟠 THANH TOÁN QUA VNPAY
            invoice.setInvoiceStatus(Invoice.InvoiceStatus.PENDING);
            invoice.setTotalAmount(planPrice);
            Invoice savedInvoice = invoiceRepository.save(invoice);


            log.info("🟡 [SUBSCRIPTION VNPAY] Invoice #{} chờ thanh toán qua VNPay.", savedInvoice.getInvoiceId());
            return savedInvoice;
        } else {
            throw new IllegalArgumentException("Phương thức thanh toán không hợp lệ: " + method);
        }
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
    @Transactional(readOnly = true)
    public Map<String, Object> getActiveSubscription(String userId) {
        // ✅ Tối ưu: gọi query nhẹ, không cần fetch user entity
        List<Map<String, Object>> result = userSubscriptionRepository.findActiveSubscriptionSimple(userId);

        if (result.isEmpty()) return null;

        Map<String, Object> row = result.get(0); // lấy gói mới nhất
        Map<String, Object> subscription = new HashMap<>();

        subscription.put("id", row.get("id"));
        subscription.put("startDate", row.get("startDate"));
        subscription.put("endDate", row.get("endDate"));
        subscription.put("usedSwaps", row.get("usedSwaps"));
        subscription.put("autoRenew", row.get("autoRenew"));

        Map<String, Object> plan = new HashMap<>();
        plan.put("planId", row.get("planId"));
        plan.put("planName", row.get("planName"));
        plan.put("description", row.get("description"));
        plan.put("swapLimit", row.get("swapLimit"));
        plan.put("durationInDays", row.get("durationInDays"));
        plan.put("priceType", row.get("priceType"));

        subscription.put("plan", plan);

        return subscription;
    }


    /**
     * Lấy TẤT CẢ lịch sử gói cước của user.
     * (Giữ nguyên)
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSubscriptionHistory(String userId) {
        List<Map<String, Object>> rows = userSubscriptionRepository.findSubscriptionHistorySimple(userId);
        return rows.stream().map(row -> {
            Map<String, Object> sub = new HashMap<>();
            sub.put("userSubscriptionId", row.get("id"));
            sub.put("status", row.get("status"));
            sub.put("autoRenew", row.get("autoRenew"));
            sub.put("startDate", row.get("startDate"));
            sub.put("endDate", row.get("endDate"));
            sub.put("usedSwaps", row.get("usedSwaps"));

            Map<String, Object> plan = new HashMap<>();
            plan.put("planId", row.get("planId"));
            plan.put("planName", row.get("planName"));
            plan.put("description", row.get("description"));
            plan.put("durationInDays", row.get("durationInDays"));
            plan.put("swapLimit", row.get("swapLimit"));
            plan.put("priceType", row.get("priceType"));

            sub.put("plan", plan);
            return sub;
        }).collect(Collectors.toList());
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
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllSubscriptionPlans() {
        List<Map<String, Object>> rows = subscriptionPlanRepository.findAllSimplePlans();

        return rows.stream().map(row -> {
            Map<String, Object> plan = new HashMap<>(row);
            Double price = systemPriceService.getPriceByType(
                    SystemPrice.PriceType.valueOf(row.get("priceType").toString())
            );

            int limit = (row.get("swapLimit") != null) ? ((Number) row.get("swapLimit")).intValue() : -1;
            plan.put("price", price);
            plan.put("swapLimitInt", limit);
            plan.put("swapLimit", limit < 0 ? "Không giới hạn" : String.valueOf(limit));

            return plan;
        }).collect(Collectors.toList());
    }



    /**
     * Sửa lại hàm này để gọi 'bookingService.confirmPayment()'
     * thay vì tự ý 'setStatus'
     */
    @Transactional
    public UserSubscription useSwapForBooking(UseSwapRequest request) {
        log.info("User {} đang sử dụng Gói tháng để thanh toán Invoice #{}", request.getUserId(), request.getInvoiceId());

        // 1. Tìm Hóa đơn (Invoice)
        Invoice invoice = invoiceRepository.findById(request.getInvoiceId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Hóa đơn: " + request.getInvoiceId()));

        // 2. Tìm Gói cước (Subscription) ĐANG HOẠT ĐỘNG
        UserSubscription activeSub = userSubscriptionRepository
                .findActiveSubscriptionForUser(
                        request.getUserId(),
                        UserSubscription.SubscriptionStatus.ACTIVE,
                        LocalDateTime.now()
                )
                .orElseThrow(() -> new IllegalStateException("Bạn không có gói cước nào đang hoạt động."));

        // --- 3. KIỂM TRA (VALIDATION) ---
        // (Giữ nguyên logic kiểm tra a, b, c)

        // a. Kiểm tra hóa đơn có phải 0 ĐỒNG không
        // (Theo yêu cầu: "amount/giá tiền bằng 0")
        // if (invoice.getTotalAmount() > 0) {
        //     throw new IllegalStateException("Hóa đơn này có giá trị. Vui lòng thanh toán bằng VNPay.");
        // }

        // b. Kiểm tra hóa đơn có đang PENDING không
        if (invoice.getInvoiceStatus() != Invoice.InvoiceStatus.PENDING) {
            throw new IllegalStateException("Hóa đơn này đã được xử lý (trạng thái: " + invoice.getInvoiceStatus() + ").");
        }

        // c. Kiểm tra số lượng pin cần đổi
        int swapsNeeded = (invoice.getNumberOfSwaps() != null && invoice.getNumberOfSwaps() > 0)
                ? invoice.getNumberOfSwaps()
                : 1;

        // d. Kiểm tra lượt đổi pin (Swap Limit)
        int limit = activeSub.getPlan().getSwapLimit();
        int used = activeSub.getUsedSwaps();
        if (limit != -1 && (used + swapsNeeded) > limit) {
            throw new IllegalStateException(String.format(
                    "Gói của bạn không đủ số lần đổi, cần %d lượt, bạn hiện còn lại %d/%d lượt. Vui lòng thử lại phương thức thanh toán khác.",
                    swapsNeeded, (limit - used), limit
            ));
        }

        // --- 4. THỰC THI (EXECUTION) ---

        // a. Trừ đúng số lượt theo số pin: Tăng 'usedSwaps'
        activeSub.setUsedSwaps(activeSub.getUsedSwaps() + swapsNeeded);
        UserSubscription updatedSub = userSubscriptionRepository.save(activeSub);
        log.info("User {} đã dùng {} lượt. (Đã dùng: {}/{}).",
                request.getUserId(), swapsNeeded, updatedSub.getUsedSwaps(), limit);

        // b. Chuyển Invoice sang PAID (Giữ nguyên)
        invoice.setInvoiceStatus(Invoice.InvoiceStatus.PAID);
        Invoice savedInvoice = invoiceRepository.save(invoice); // <-- Lấy Hóa đơn đã lưu
        log.info("Invoice #{} đã được chuyển sang PAID.", savedInvoice.getInvoiceId());

        // c. Bắn (Publish) Sự kiện
        log.info("Phát sự kiện InvoicePaidEvent cho Invoice #{}", savedInvoice.getInvoiceId());
        eventPublisher.publishEvent(new InvoicePaidEvent(this, savedInvoice));
        // --- (Hết code mới) ---

        return updatedSub; // Trả về thông tin gói cước đã cập nhật
    }

    @Transactional
    public Map<String, Object> cancelSubscriptionImmediately(String userId) {

        // 1. Lấy subscription ACTIVE
        List<UserSubscription> subs = userSubscriptionRepository.findActiveSubscriptions(userId);

        if (subs.isEmpty()) {
            throw new IllegalStateException("Không tìm thấy gói cước đang hoạt động.");
        }

        // lấy gói mới nhất
        UserSubscription activeSub = subs.get(0);

        // 2. Không cho hủy nếu đã hết hạn
        if (activeSub.getEndDate().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Gói cước đã hết hạn, không thể hủy.");
        }

        LocalDateTime now = LocalDateTime.now();
        long totalDays = Math.max(1, Duration.between(activeSub.getStartDate(), activeSub.getEndDate()).toDays());
        long usedDays = Math.max(0, Duration.between(activeSub.getStartDate(), now).toDays());

        Double planPrice = systemPriceService.getPriceByType(activeSub.getPlan().getPriceType());
        if (planPrice == null || planPrice <= 0) {
            planPrice = 0.0;
        }

        // ✅ Rule mới: refund theo lượt nếu huỷ trong <= 14 ngày
        int limit = activeSub.getPlan().getSwapLimit(); // total swaps
        int used = activeSub.getUsedSwaps();            // used swaps
        int REFUND_WINDOW_DAYS = 14;
        double refundAmount = 0.0;

        if (usedDays <= REFUND_WINDOW_DAYS) {
            if (limit > 0) {
                int remainingSwaps = Math.max(0, limit - used);
                double swapFactor = remainingSwaps / (double) limit;

                refundAmount = Math.round(planPrice * swapFactor);
                if (refundAmount < 1000) refundAmount = 0;
            } else {
                refundAmount = 0;
            }
        } else {
            refundAmount = 0;
        }

        // ✅ Lấy invoice thanh toán gần nhất
        List<Invoice> invoices = invoiceRepository.findLatestPaidSubscriptionInvoices(userId);
        if (invoices.isEmpty()) {
            throw new IllegalStateException("Không tìm thấy hóa đơn đã thanh toán.");
        }

        Invoice invoice = invoices.get(0);

        // 3. Hủy gói
        activeSub.setStatus(UserSubscription.SubscriptionStatus.CANCELLED);
        activeSub.setAutoRenew(false);
        userSubscriptionRepository.save(activeSub);

        // ✅ 4. Refund ví
        if (refundAmount > 0) {
            User user = activeSub.getUser();
            user.setWalletBalance(user.getWalletBalance() + refundAmount);
            userRepository.save(user);

            paymentRepository.save(Payment.builder()
                    .invoice(invoice)
                    .amount(refundAmount)
                    .paymentMethod(Payment.PaymentMethod.WALLET)
                    .paymentStatus(Payment.PaymentStatus.SUCCESS)
                    .transactionType(Payment.TransactionType.REFUND)
                    .message("Hoàn tiền hủy gói cước sớm")
                    .createdAt(LocalDateTime.now())
                    .build());
        }

        // 5. Return result (KHÔNG dùng Map.of — tránh null crash)
        Map<String, Object> result = new HashMap<>();
        result.put("status", activeSub.getStatus().name());
        result.put("remainingDays", Math.max(0, totalDays - usedDays));
        result.put("remainingSwaps", limit > 0 ? Math.max(0, limit - used) : null);
        result.put("refundAmount", refundAmount);
        result.put("cancelledAt", LocalDateTime.now());

        return result;
    }



}
