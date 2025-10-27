package BatterySwapStation.service;

import BatterySwapStation.entity.EmailVerificationToken;
import BatterySwapStation.entity.User;
import BatterySwapStation.repository.EmailVerificationTokenRepository;
import BatterySwapStation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.text.StringEscapeUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ForgotPasswordService {

    private final EmailVerificationTokenRepository tokenRepo;
    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private static final String RESET_URL = "http://localhost:5173/reset-password?token=";

    /**
     * Gửi email đặt lại mật khẩu và trả về link FE
     */
    public String sendResetPasswordLink(String email) {
        //  Kiểm tra user tồn tại
        User user = userRepo.findByEmail(email);
        if (user == null) {
            throw new RuntimeException("Email không tồn tại trong hệ thống.");
        }

        // 2️⃣ Xóa token cũ (nếu có)
        tokenRepo.findByUser(user).ifPresent(tokenRepo::delete);

        // Tạo token mới
        String token = UUID.randomUUID().toString();
        EmailVerificationToken resetToken = EmailVerificationToken.builder()
                .user(user)
                .token(token)
                .tokenType(EmailVerificationToken.TokenType.RESET_PASSWORD)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .isUsed(false)
                .build();
        tokenRepo.save(resetToken);

        // 4️⃣ Gửi email có cùng style
        String resetUrl = RESET_URL + token;
        String html = getResetPasswordTemplate(user.getFullName(), resetUrl);

        emailService.sendEmail(
                user.getEmail(),
                "Yêu cầu đặt lại mật khẩu - Battery Swap Station",
                html
        );

        // Trả về link FE cho controller (để phản hồi cho FE)
        return resetUrl;
    }

    /**
     * Giao diện HTML đồng nhất style verify mail
     */
    private String getResetPasswordTemplate(String fullName, String resetUrl) {
        String safeName = StringEscapeUtils.escapeHtml4(fullName);
        String safeUrl = StringEscapeUtils.escapeHtml4(resetUrl);

        return """
            <div style="font-family:Arial,sans-serif;line-height:1.6">
                <h2 style="color:#007bff;">Xin chào, %s 👋</h2>
                <p>Bạn vừa yêu cầu đặt lại mật khẩu tại <b>Battery Swap Station</b>.</p>
                <p>Nhấn vào nút bên dưới để thay đổi mật khẩu (liên kết có hiệu lực trong 30 phút):</p>
                <p>
                    <a href="%s" style="background-color:#007bff;color:white;
                        padding:10px 20px;text-decoration:none;border-radius:5px;">
                        Đặt lại mật khẩu
                    </a>
                </p>
                <p>Nếu bạn không yêu cầu thao tác này, vui lòng bỏ qua email này.</p>
                <hr>
                <p style="font-size:12px;color:gray;">
                    © 2025 Battery Swap Station Team
                </p>
            </div>
            """.formatted(safeName, safeUrl);
    }


    /**
     * Đặt lại mật khẩu bằng token
     */
    public void resetPassword(String token, String newPassword, String confirmPassword) {
        if (!newPassword.equals(confirmPassword)) {
            throw new RuntimeException("Mật khẩu xác nhận không khớp!");
        }

        EmailVerificationToken resetToken = tokenRepo.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Token không hợp lệ!"));

        if (resetToken.getTokenType() != EmailVerificationToken.TokenType.RESET_PASSWORD) {
            throw new RuntimeException("Token không hợp lệ cho việc đặt lại mật khẩu!");
        }

        if (resetToken.isUsed() || resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Liên kết đặt lại mật khẩu đã hết hạn hoặc đã được sử dụng!");
        }

        // Cập nhật mật khẩu
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepo.save(user);

        // Đánh dấu token đã dùng
        resetToken.setUsed(true);
        tokenRepo.save(resetToken);
    }
}
