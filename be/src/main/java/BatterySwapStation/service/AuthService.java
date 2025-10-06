package BatterySwapStation.service;

import java.time.LocalDateTime;

import BatterySwapStation.dto.RoleDTO;
import BatterySwapStation.utils.UserIdGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import BatterySwapStation.dto.LoginRequest;
import BatterySwapStation.dto.RegisterRequest;
import BatterySwapStation.dto.AuthResponse;
import BatterySwapStation.entity.Role;
import BatterySwapStation.entity.User;
import BatterySwapStation.repository.RoleRepository;
import BatterySwapStation.repository.UserRepository;


@Service
@RequiredArgsConstructor

public class AuthService {

    private UserRepository userRepository;
    private final UserService userService;
    private RoleRepository roleRepository;

    //    @Autowired
//    private final UserIdGenerator userIdGenerator;
    private final JwtService jwtService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();





    // Đăng nhập
    public AuthResponse login(LoginRequest req) {
        User user = userService.findByEmail(req.getEmail());
        if (user == null) {
            throw new RuntimeException("Email không tồn tại");
        }

        if (!userService.checkPassword(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu không đúng");
        }


        String token = jwtService.generateToken(
                user.getUserId(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().getRoleName()
        );

        return new AuthResponse(
                "Đăng nhập thành công",
                user.getUserId(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().getRoleName(),
                token
        );
    }



    // Cập nhật role cho user
    public boolean updateUserRole(String userId, RoleDTO roleDTO) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return false;

        Role role = null;
        if (roleDTO.getRoleId() != 0) {
            role = roleRepository.findByRoleId(roleDTO.getRoleId());
        }
        if (role == null && roleDTO.getRoleName() != null) {
            role = roleRepository.findByRoleName(roleDTO.getRoleName());
        }
        if (role == null) return false;

        user.setRole(role);
        userRepository.save(user);
        return true;
    }
}
