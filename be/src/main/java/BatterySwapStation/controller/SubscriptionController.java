package BatterySwapStation.controller;

import BatterySwapStation.entity.Invoice;
import BatterySwapStation.entity.UserSubscription;
import BatterySwapStation.service.SubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data; // Cần import Lombok
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

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
            @RequestBody SubscribeRequest request // <-- DTO phải chứa userId
            // [XÓA] @AuthenticationPrincipal UserDetails userDetails
    ) {

        try {
            // [SỬA] Lấy userId KHÔNG AN TOÀN từ JSON (tạm thời)
            String userId = request.getUserId();
            if (userId == null || userId.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "userId là bắt buộc"));
            }

            Invoice invoice = subscriptionService.createSubscriptionInvoice(userId, request.getPlanId());

            // Trả về thông tin invoice để frontend xử lý thanh toán
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Hóa đơn cho gói cước đã được tạo. Vui lòng thanh toán.",
                    "invoiceId", invoice.getInvoiceId(),
                    "totalAmount", invoice.getTotalAmount(),
                    "status", invoice.getInvoiceStatus()
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
     * DTO (Data Transfer Object) cho request đăng ký
     */
    @Data
    public static class SubscribeRequest {
        // (Sử dụng Integer hay Long tùy thuộc vào lỗi hôm qua bạn đã sửa)
        private Integer planId; // ID của SubscriptionPlan
        private String userId; // ID của User (thêm trường này)
    }
}