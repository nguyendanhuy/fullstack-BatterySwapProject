package BatterySwapStation.controller;

import BatterySwapStation.dto.*;

import BatterySwapStation.entity.*;
import BatterySwapStation.service.*;
import BatterySwapStation.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;


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

    private static final String FRONTEND_VERIFY_URL = "http://localhost:5173/verify-email";

<<<<<<< HEAD
=======

>>>>>>> 8130857fd984e0874efedf78568e80a38bc41774

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        User user = userService.registerUser(req);

        String token = emailVerificationService.createVerificationToken(user);
        String verifyUrl = FRONTEND_VERIFY_URL + "?token=" + token;
        emailService.sendVerificationEmail(user.getFullName(), user.getEmail(), verifyUrl);

<<<<<<< HEAD
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
=======
        // 🆕 Sinh resendToken để FE lưu
        String resendToken = jwtService.generateResendToken(user.getEmail());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(Map.of(
                        "message", "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.",
                        "userId", user.getUserId(),
                        "resendToken", resendToken
                ));
>>>>>>> 8130857fd984e0874efedf78568e80a38bc41774
    }


    @GetMapping("/send")
    public String testEmail(@RequestParam String to) {
        emailService.sendVerificationEmail("Test User", to, "https://example.com/verify");
        return "✅ Email test đã gửi tới " + to;
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

        return ResponseEntity.ok(Map.of(
                "userId", user.getUserId(),
                "email", user.getEmail(),
                "fullName", user.getFullName(),
                "phone", user.getPhone(),
                "role", user.getRole().getRoleName()
        ));
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
<<<<<<< HEAD

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
=======
>>>>>>> 8130857fd984e0874efedf78568e80a38bc41774

    }

<<<<<<< HEAD
            String newToken = emailVerificationService.createVerificationToken(user);
            String verifyUrl = FRONTEND_VERIFY_URL + "?token=" + newToken;
            emailService.sendVerificationEmail(user.getFullName(), email, verifyUrl);

            return ResponseEntity.ok(Map.of(
                    "status", 200,
                    "success", true,
                    "message", "Email xác minh mới đã được gửi tới " + email
=======
    @PostMapping("/resend-verification-by-token")
    public ResponseEntity<?> resendVerificationByToken(@RequestParam("token") String resendToken) {
        try {
            String email = jwtService.extractEmailFromResendToken(resendToken);
            User user = emailVerificationService.getUserByEmail(email);

            if (user.isVerified()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "status", 400,
                        "success", false,
                        "message", "Tài khoản này đã được xác thực rồi!"
                ));
            }

            // Xóa token cũ và tạo mới
            emailVerificationService.invalidateOldTokens(user);

            String newToken = emailVerificationService.createVerificationToken(user);
            String verifyUrl = FRONTEND_VERIFY_URL + "?token=" + newToken;
            emailService.sendVerificationEmail(user.getFullName(), user.getEmail(), verifyUrl);

            // Sinh resendToken mới (thay token cũ)
            String nextResendToken = jwtService.generateResendToken(email);

            return ResponseEntity.ok(Map.of(
                    "status", 200,
                    "success", true,
                    "message", "Email xác minh mới đã được gửi tới " + email,
                    "resendToken", nextResendToken
>>>>>>> 8130857fd984e0874efedf78568e80a38bc41774
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
<<<<<<< HEAD
=======

>>>>>>> 8130857fd984e0874efedf78568e80a38bc41774
}