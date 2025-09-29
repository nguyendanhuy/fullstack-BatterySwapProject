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

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    private final UserIdGenerator userIdGenerator;



    public User registerUser(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email đã tồn tại!");
        }

        Role role = roleRepository.findByRoleId(req.getRoleId());
        if (role == null) {
            throw new RuntimeException("Role không tồn tại!");
        }

        String generatedId = userIdGenerator.generateUserId(role);

        // Tạo user mới
        User user = new User();
        user.setUserId(generatedId);
        user.setFullName(req.getFullName());
        user.setEmail(req.getEmail());
        user.setPhone(req.getPhone());
        user.setAddress(req.getAddress());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole(role);

        return userRepository.save(user);
    }


}
