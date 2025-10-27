package BatterySwapStation.service;

import BatterySwapStation.entity.EmailVerificationToken;
import BatterySwapStation.entity.User;
import BatterySwapStation.repository.EmailVerificationTokenRepository;
import BatterySwapStation.repository.UserRepository;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final EmailVerificationTokenRepository tokenRepo;
    private final UserRepository userRepo;
    private final JwtService jwtService;


    public String createVerificationToken(User user) {
        String uuidToken = UUID.randomUUID().toString();

        EmailVerificationToken verificationToken = EmailVerificationToken.builder()
                .user(user)
                .token(uuidToken)
                .tokenType(EmailVerificationToken.TokenType.VERIFY_EMAIL)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .isUsed(false)
                .build();

        tokenRepo.save(verificationToken);

        // 🔹 Trả JWT token chứa email, dùng để verify link FE
        return jwtService.generateVerifyEmailToken(user.getEmail());
    }


    @Transactional
    public String verifyEmail(String token) {
        String email;

        // 1️⃣ Check token hợp lệ & chưa hết hạn
        try {
            email = jwtService.extractEmailStrict(token); // 👉 dùng strict để chặn expired
        } catch (ExpiredJwtException ex) {
            throw new RuntimeException("Liên kết xác thực đã hết hạn. Vui lòng yêu cầu gửi lại email xác minh.");
        } catch (Exception e) {
            throw new RuntimeException("Liên kết xác thực không hợp lệ hoặc đã bị thay đổi!");
        }

        // 2️⃣ Lấy user tương ứng
        User user = userRepo.findByEmail(email);
        if (user == null) {
            throw new RuntimeException("Không tìm thấy người dùng.");
        }

        if (user.isVerified()) {
            throw new RuntimeException("Tài khoản này đã được xác thực trước đó!");
        }

        // 3️⃣ Cập nhật trạng thái user
        user.setVerified(true);
        userRepo.save(user);

        // 4️⃣ Đánh dấu các token cũ là used
        List<EmailVerificationToken> tokens = tokenRepo.findAllByUser(user);
        for (EmailVerificationToken t : tokens) {
            if (!t.isUsed()) {
                t.setUsed(true);
            }
        }
        tokenRepo.saveAll(tokens);

        // 5️⃣ Trả kết quả thành công
        return "Tài khoản " + email + " đã được xác thực thành công!";
    }

    public User getUserByEmail(String email) {
        User user = userRepo.findByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("Không tìm thấy người dùng với email: " + email);
        }
        return user;
    }
}
