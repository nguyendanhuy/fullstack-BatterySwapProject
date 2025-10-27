package BatterySwapStation.controller;

import BatterySwapStation.dto.*;

import BatterySwapStation.entity.*;
import BatterySwapStation.repository.StaffAssignRepository;
import BatterySwapStation.repository.UserSubscriptionRepository;
import BatterySwapStation.service.*;
import BatterySwapStation.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;


import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@PreAuthorize("permitAll()")
@RequestMapping("/api/auth")
@RequiredArgsConstructor

public class AuthController {

    private final UserService userService;
    private final AuthService authService;
    private final EmailVerificationService emailVerificationService;
    private final EmailService emailService;
    private final JwtService jwtService;
    private final GoogleService googleService;
    private final StaffAssignRepository staffAssignRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final ForgotPasswordService forgotPasswordService;



    private static final String FRONTEND_VERIFY_URL = "http://localhost:5173/verify-email";
    //private static final String RESET_URL = "http://localhost:5173/reset-password?token=";



    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        User user = userService.registerUser(req);

        String token = emailVerificationService.createVerificationToken(user);
        String verifyUrl = FRONTEND_VERIFY_URL + "?token=" + token;
        emailService.sendVerificationEmail(user.getFullName(), user.getEmail(), verifyUrl);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.",
                "userId", user.getUserId(),
                "verifyLink", verifyUrl
        ));
    }


    @GetMapping("/send")
    public String testEmail(@RequestParam String to) {
        emailService.sendVerificationEmail("Test User", to, "https://example.com/verify");
        return "Email test đã gửi tới " + to;
    }


    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PutMapping("/role/{userId}")
    public ResponseEntity<?> updateUserRole(
            @PathVariable String userId,
            @RequestBody RoleDTO roleDTO) {
        boolean updated = authService.updateUserRole(userId, roleDTO);
        if (updated) {
            return ResponseEntity.ok("Role cập nhật thành công");
        } else {
            return ResponseEntity.badRequest().body("User và Role không tìm thấy");
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body("Không có quyền truy cập");
        }

        Integer assignedStationId = null;
        Long activeSubscriptionId = null;

        // 🔹 Nếu là Staff
        if (user.getRole().getRoleId() == 2) {
            StaffAssign assign = staffAssignRepository.findFirstByUser_UserIdAndIsActiveTrue(user.getUserId());
            if (assign != null) assignedStationId = assign.getStationId();
        }

        // 🔹 Nếu là Driver
        if (user.getRole().getRoleId() == 1) {
            UserSubscription sub = userSubscriptionRepository
                    .findFirstByUser_UserIdAndStatusAndEndDateAfter(
                            user.getUserId(),
                            UserSubscription.SubscriptionStatus.ACTIVE,
                            LocalDateTime.now()
                    );
            if (sub != null && sub.getPlan() != null) {
                activeSubscriptionId = sub.getPlan().getId();
            }
        }

        // ✅ Sử dụng HashMap để cho phép null value (tránh NPE)
        Map<String, Object> result = new HashMap<>();
        result.put("userId", user.getUserId());
        result.put("email", user.getEmail());
        result.put("fullName", user.getFullName());
        result.put("phone", user.getPhone());
        result.put("role", user.getRole().getRoleName());
        result.put("assignedStationId", assignedStationId);
        result.put("activeSubscriptionId", activeSubscriptionId); // 💰 Cho phép null

        return ResponseEntity.ok(result);
    }




    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam("token") String token) {
        try {
            String result = emailVerificationService.verifyEmail(token);
            return ResponseEntity.ok(Map.of(
                    "status", 200,
                    "success", true,
                    "message", result
            ));
        } catch (RuntimeException ex) {
            // ✅ Bắt lỗi từ EmailVerificationService
            // ✅ Lỗi logic (token hết hạn, không hợp lệ, v.v.)
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "status", 400,
                    "success", false,
                    "message", ex.getMessage()
            ));
        } catch (Exception ex) {
            // ✅ Lỗi bất ngờ
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "status", 500,
                    "success", false,
                    "message", "Đã xảy ra lỗi khi xác thực email. Vui lòng thử lại sau."
            ));
        }

    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@RequestParam("token") String token) {
        try {
            String email = jwtService.extractEmailAllowExpired(token);
            User user = emailVerificationService.getUserByEmail(email);

            if (user.isVerified()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", 400,
                        "success", false,
                        "message", "Tài khoản này đã được xác thực rồi!"
                ));
            }


            String newToken = emailVerificationService.createVerificationToken(user);
            String verifyUrl = FRONTEND_VERIFY_URL + "?token=" + newToken;
            emailService.sendVerificationEmail(user.getFullName(), email, verifyUrl);

            return ResponseEntity.ok(Map.of(
                    "status", 200,
                    "success", true,
                    "message", "Email xác minh mới đã được gửi tới " + email
            ));

        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "status", 400,
                    "success", false,
                    "message", ex.getMessage()
            ));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "status", 500,
                    "success", false,
                    "message", "Không thể gửi lại email xác minh. Vui lòng thử lại sau."
            ));
        }
    }

    @PostMapping("/google")
    @Operation(summary = "Đăng nhập / Đăng ký qua Google")
    public ResponseEntity<?> loginWithGoogle(@RequestBody GoogleLoginRequest request) {
        try {
            GoogleUserInfo info = googleService.verifyAndExtract(request.getToken());
            AuthResponse result = authService.handleGoogleLogin(info);

            // trả thẳng result ra, KHÔNG bọc data
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "success", false,
                            "message", "Lỗi xác thực Google: " + e.getMessage()
                    ));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest req) {
        String resetLink = forgotPasswordService.sendResetPasswordLink(req.getEmail());

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Yêu cầu đặt lại mật khẩu đã được gửi! Vui lòng kiểm tra email.",
                "email", req.getEmail(),
                "resetLink", resetLink
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest req) {
        forgotPasswordService.resetPassword(
                req.getToken(),
                req.getNewPassword(),
                req.getConfirmPassword()
        );

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Mật khẩu của bạn đã được cập nhật thành công."
        ));
    }




}