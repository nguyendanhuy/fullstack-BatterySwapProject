package BatterySwapStation.repository;

import BatterySwapStation.entity.EmailVerificationToken;
import BatterySwapStation.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {
    Optional<EmailVerificationToken> findByToken(String token);
    List<EmailVerificationToken> findAllByUser(User user);
    Optional<EmailVerificationToken> findByUser(User user);

}
