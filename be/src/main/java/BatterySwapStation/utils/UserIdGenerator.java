package BatterySwapStation.utils;

import BatterySwapStation.entity.Role;
import BatterySwapStation.entity.User;
import BatterySwapStation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class UserIdGenerator {

    private final UserRepository userRepository;

    /**
     * 🔹 Sinh userId mới dạng DR001 / ST001 / AD001, ...
     *   Dựa vào MAX(UserId) hiện có (không trùng, không reset)
     */
    public String generateUserId(Role role) {
        if (role == null || role.getRoleName() == null) {
            throw new IllegalArgumentException("Role không hợp lệ khi sinh User ID");
        }

        String prefix = switch (role.getRoleName().toUpperCase()) {
            case "DRIVER" -> "DR";
            case "STAFF" -> "ST";
            case "ADMIN" -> "AD";
            default -> "GU";
        };

        // 🔹 Lọc tất cả user có cùng role
        List<User> all = userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && u.getRole().getRoleId() == role.getRoleId())
                .collect(Collectors.toList());

        // 🔹 Lấy số lớn nhất hiện có
        int max = all.stream()
                .map(User::getUserId)
                .filter(id -> id.startsWith(prefix))
                .map(id -> id.substring(2))
                .mapToInt(Integer::parseInt)
                .max()
                .orElse(0);

        return String.format("%s%03d", prefix, max + 1);
    }
}
