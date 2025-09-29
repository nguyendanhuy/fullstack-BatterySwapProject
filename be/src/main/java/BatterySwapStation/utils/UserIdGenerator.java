package BatterySwapStation.utils;

import BatterySwapStation.entity.Role;
import BatterySwapStation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserIdGenerator {

    private final UserRepository userRepository;

    public String generateUserId(Role role) {
        long count = userRepository.countByRole_RoleId(role.getRoleId()) + 1;

        String prefix;
        switch (role.getRoleName().toUpperCase()) {
            case "DRIVER" -> prefix = "DR";
            case "STAFF" -> prefix = "ST";
            case "ADMIN" -> prefix = "AD";
            default -> prefix = "GU";
        }

        return String.format("%s%03d", prefix, count);
    }
}
