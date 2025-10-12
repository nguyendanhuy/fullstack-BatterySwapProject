package BatterySwapStation.service;

import BatterySwapStation.dto.RegisterRequest;
import BatterySwapStation.entity.Role;
import BatterySwapStation.entity.User;
import BatterySwapStation.repository.RoleRepository;
import BatterySwapStation.repository.UserRepository;
import BatterySwapStation.utils.UserIdGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

import static BatterySwapStation.utils.NameFormatter.formatFullName;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    private final UserIdGenerator userIdGenerator;


    public User registerUser(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email đã tồn tại!");
        }

        if (!req.getPassword().equals(req.getConfirmPassword())) {
            throw new IllegalArgumentException("Mật khẩu xác nhận không khớp");
        }

        Role role = roleRepository.findByRoleId(1);
        if (role == null) {
            throw new IllegalArgumentException("Role mặc định (Driver) không tồn tại!");
        }


        String generatedId = userIdGenerator.generateUserId(role);

        User user = new User();
        user.setUserId(generatedId);
        String formattedName = formatFullName(req.getFullName());
        user.setFullName(formattedName);
        user.setEmail(req.getEmail());
        user.setPhone(req.getPhone());
        user.setAddress(req.getAddress());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole(role);
        user.setActive(true);
        user.setCreateAt(LocalDateTime.now());
        user.setUpdateAt(LocalDateTime.now());
        return userRepository.save(user);
    }


    public User findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public boolean checkPassword(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }

    public User findById(String userId) {
        return userRepository.findById(userId).orElse(null);
    }


}
