package BatterySwapStation.controller;

import BatterySwapStation.dto.SubscriptionRequest;
import BatterySwapStation.dto.UseSwapRequest;
import BatterySwapStation.entity.Invoice;
import BatterySwapStation.entity.UserSubscription;
import BatterySwapStation.service.SubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.Data; // Cần import Lombok
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
// (Giả sử bạn đã có SecurityConfig để lấy 'principal' - người dùng đã đăng nhập)
// import org.springframework.security.core.Authentication;
// import org.springframework.security.core.userdetails.UserDetails;

@RestController
@RequestMapping("/api/plans")
@Tag(name = "Subscription Management", description = "APIs đăng ký và quản lý gói cước")
public class SubscriptionController {

    @Autowired
    private SubscriptionService subscriptionService;

    /**
     * API để user bắt đầu đăng ký một gói cước.
     * Trả về 1 Invoice PENDING.
     */
    @PostMapping("/subscribe")
    @Operation(summary = "Đăng ký gói cước", description = "Tạo hóa đơn đăng ký gói cước mới cho user.")
    public ResponseEntity<Map<String, Object>> subscribeToPlan(
            @RequestBody SubscriptionRequest request // <-- DTO phải chứa userId
            // [XÓA] @AuthenticationPrincipal UserDetails userDetails
    ) {

        try {
            // [SỬA] Lấy userId KHÔNG AN TOÀN từ JSON (tạm thời)
            String userId = request.getUserId();
            if (userId == null || userId.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "userId là bắt buộc"));
            }

            // ✅ [SỬA LỖI] Truyền toàn bộ đối tượng 'request'
            Invoice newInvoice = subscriptionService.createSubscriptionInvoice(request);

            // Trả về thông tin invoice để frontend xử lý thanh toán
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Hóa đơn cho gói cước đã được tạo. Vui lòng thanh toán.",
                    "invoiceId", newInvoice.getInvoiceId(),
                    "totalAmount", newInvoice.getTotalAmount(),
                    "status", newInvoice.getInvoiceStatus()
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    // (Giả sử dùng phiên bản không an toàn để nhất quán với team)
    @Data
    public static class CancelRequest {
        private String userId;
    }

    @PostMapping("/cancel") // (API này nên là /my-subscription/cancel nếu dùng @AuthenticationPrincipal)
    @Operation(summary = "Hủy gói cước", description = "Tắt tự động gia hạn. Gói cước vẫn dùng được đến hết hạn.")
    public ResponseEntity<Map<String, Object>> cancelSubscription(
            @RequestBody CancelRequest request
    ) {
        try {
            // (Nếu dùng @AuthenticationPrincipal thì lấy userId từ token)
            String userId = request.getUserId();

            UserSubscription cancelledSub = subscriptionService.cancelSubscription(userId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Đã tắt tự động gia hạn. Gói cước của bạn sẽ hết hạn vào: " + cancelledSub.getEndDate(),
                    "status", cancelledSub.getStatus().name(), // Vẫn là ACTIVE
                    "autoRenew", cancelledSub.isAutoRenew() // Sẽ là false
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * API để lấy gói cước ĐANG HOẠT ĐỘNG (ACTIVE)
     */
    @GetMapping("/my-subscription")
    @Operation(summary = "Lấy gói cước đang ACTIVE",
            description = "Lấy thông tin gói cước đang hoạt động (nếu có) của user.")
    public ResponseEntity<Map<String, Object>> getMyActiveSubscription(
            @RequestParam String userId
    ) {
        try {
            Map<String, Object> activeSub = subscriptionService.getActiveSubscription(userId);

            if (activeSub == null) {
                // ✅ [SỬA LỖI] Dùng HashMap thay vì Map.of()
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Bạn không có gói cước nào đang hoạt động.");
                response.put("subscription", null); // HashMap chấp nhận 'null'

                return ResponseEntity.ok(response);
            }

            // (Khối này giữ nguyên, vì activeSub không null)
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Lấy thông tin gói cước thành công.",
                    "subscription", activeSub
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * API để lấy TẤT CẢ lịch sử gói cước
     */
    @GetMapping("/my-history")
    @Operation(summary = "Lấy lịch sử gói cước",
            description = "Lấy tất cả các gói cước đã mua (active, expired, cancelled).")
    public ResponseEntity<Map<String, Object>> getMySubscriptionHistory(
            @RequestParam String userId
    ) {
        try {
            List<Map<String, Object>> history = subscriptionService.getSubscriptionHistory(userId);

            // --- ✅ [THÊM MỚI] Kiểm tra nếu không có lịch sử ---
            if (history.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "message", "Bạn chưa có lịch sử đăng ký gói cước nào.", // <-- Thông báo mới
                        "history", history, // Sẽ là []
                        "total", 0
                ));
            }
            // --- (Kết thúc) ---

            // (Code cũ) Trả về khi có lịch sử
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Lấy lịch sử gói cước thành công.",
                    "history", history,
                    "total", history.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/all")
    @Operation(summary = "Lấy tất cả các Gói Subscription có sẵn",
            description = "Hiển thị danh sách tất cả các gói (Basic, Premium, Unlimited) mà user có thể đăng ký.")
    public ResponseEntity<Map<String, Object>> getAllPlans() {
        try {
            List<Map<String, Object>> plans = subscriptionService.getAllSubscriptionPlans();

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Lấy danh sách gói thành công.",
                    "plans", plans
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/use-swap")
    @Operation(summary = "Thanh toán Booking bằng Gói tháng (dùng 1 lượt)",
            description = "User gọi API này để 'thanh toán' cho Invoice 0 ĐỒNG, sử dụng 1 lượt trong gói cước.")
    public ResponseEntity<Map<String, Object>> useSwapForBooking(
            @Valid @RequestBody UseSwapRequest request
    ) {
        try {
            UserSubscription updatedSub = subscriptionService.useSwapForBooking(request);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Thanh toán bằng gói cước thành công. Booking đã được kích hoạt.",
                    "updatedSubscription", Map.of(
                            "userSubscriptionId", updatedSub.getId(),
                            "usedSwaps", updatedSub.getUsedSwaps(),
                            "swapLimit", updatedSub.getPlan().getSwapLimit()
                    )
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/cancel-immediately")
    @Operation(summary = "Hủy gói cước ngay lập tức có hoàn tiền",
            description = "Hủy gói ngay, chuyển status thành CANCELLED và hoàn tiền theo lượt còn lại.")
    public ResponseEntity<Map<String, Object>> cancelSubscriptionImmediately(
            @RequestBody CancelRequest request
    ) {
        try {
            String userId = request.getUserId();

            Map<String, Object> result = subscriptionService.cancelSubscriptionImmediately(userId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Gói cước đã bị hủy ngay lập tức.",
                    "refundAmount", result.get("refundAmount"),
                    "remainingSwaps", result.get("remainingSwaps"),
                    "status", result.get("status")
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }
}