package BatterySwapStation.service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Service
public class JwtService {

    private final Key key;
    private final long expirationMillis;

    private final Key resendKey;
    private final long resendExpirationMillis;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long expirationMillis,
            @Value("${jwt.resend.secret}") String resendSecret,
            @Value("${jwt.resend.expiration}") long resendExpirationMillis
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMillis = expirationMillis;
        this.resendKey = Keys.hmacShaKeyFor(resendSecret.getBytes(StandardCharsets.UTF_8));
        this.resendExpirationMillis = resendExpirationMillis;

        //  Log để xác minh đã load đúng từ .env (tùy chọn)
        System.out.println(" JWT Main : " + expirationMillis + " ms");
        System.out.println(" JWT Resend : " + resendExpirationMillis + " ms");
    }

    // 🔐 TOKEN CHO LOGIN

    public String generateToken(String userId, String email, String phone, String role) {
        return Jwts.builder()
                .setSubject(userId)
                .claim("email", email)
                .claim("phone", phone)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationMillis))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUserId(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public boolean isTokenValid(String jwt, UserDetails userDetails) {
        final String userId = extractUserId(jwt);
        return (userId.equals(userDetails.getUsername())) && !isTokenExpired(jwt);
    }

    private boolean isTokenExpired(String jwt) {
        final Date expiration = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(jwt)
                .getBody()
                .getExpiration();
        return expiration.before(new Date());
    }


    public String generateVerifyEmailToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .claim("purpose", "verify_email")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + resendExpirationMillis)) // ví dụ 15 phút
                .signWith(resendKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractEmailAllowExpired(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(resendKey)
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
        } catch (io.jsonwebtoken.ExpiredJwtException ex) {
            return ex.getClaims().getSubject(); //  vẫn lấy được email nếu token hết hạn
        } catch (Exception ex) {
            throw new IllegalArgumentException("Token không hợp lệ hoặc bị thay đổi!");
        }
    }

    public String extractEmailStrict(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(resendKey)
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
        } catch (io.jsonwebtoken.ExpiredJwtException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalArgumentException("Token không hợp lệ hoặc bị thay đổi!");
        }
    }
    //GG
    public String generateToken(BatterySwapStation.entity.User user) {
        return generateToken(
                user.getUserId(),
                user.getEmail(),
                user.getPhone(),
                user.getRole() != null ? user.getRole().getRoleName() : "USER"
        );
    }

}