package BatterySwapStation.service;

import BatterySwapStation.dto.*;
import BatterySwapStation.entity.StaffAssign;
import BatterySwapStation.entity.UserSubscription;
import BatterySwapStation.repository.*;
import BatterySwapStation.utils.UserIdGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import BatterySwapStation.entity.Role;
import BatterySwapStation.entity.User;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserIdGenerator userIdGenerator;
    private final UserRepository userRepository;
    private final UserService userService;
    private final RoleRepository roleRepository;
    private final JwtService jwtService;
    private final StaffAssignRepository staffAssignRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final SwapRepository swapRepository;


    public Map<String, Object> login(LoginRequest req) {
        User user = userService.findByEmail(req.getEmail());
        if (user == null) throw new RuntimeException("Email không tồn tại");
        if (!userService.checkPassword(req.getPassword(), user.getPassword()))
            throw new RuntimeException("Mật khẩu không đúng");
        if (!user.isActive()) throw new RuntimeException("Tài khoản đã bị vô hiệu hóa");
        if (!user.isVerified()) throw new RuntimeException("Bạn chưa xác thực email");

        String token = jwtService.generateToken(
                user.getUserId(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().getRoleName(),
                null,
                null
        );

        return buildUserResponse(user, token, "Đăng nhập thành công");
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

    @Transactional
    public Map<String, Object> handleGoogleLogin(GoogleUserInfo info) {
        User user = userRepository.findByEmail(info.getEmail());
        boolean isNew = false;

        if (user == null) {
            Role defaultRole = roleRepository.findByRoleName("DRIVER");
            user = new User();
            user.setUserId(userIdGenerator.generateUserId(defaultRole));
            user.setFullName(info.getName());
            user.setEmail(info.getEmail());
            user.setPassword("");
            user.setAddress("");
            user.setPhone("");
            user.setActive(true);
            user.setVerified(info.isEmailVerified());
            user.setRole(defaultRole);
            userRepository.save(user);
            isNew = true;
        }

        if (!user.isActive()) throw new RuntimeException("Tài khoản đã bị vô hiệu hóa");
        if (!user.isVerified()) throw new RuntimeException("Bạn chưa xác thực email Google");

        String token = jwtService.generateToken(
                user.getUserId(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().getRoleName(),
                null,
                null
        );

        String msg = isNew
                ? "Đăng ký Google thành công. Vui lòng cập nhật SĐT & địa chỉ"
                : "Đăng nhập thành công";

        return buildUserResponse(user, token, msg);
    }


    public Map<String, Object> getCurrentUserInfo(User user) {
        return buildUserResponse(user, null, "OK");
    }

    private Map<String, Object> buildUserResponse(User user, String token, String message) {

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("message", message);
        res.put("userId", user.getUserId());
        res.put("email", user.getEmail());
        res.put("fullName", user.getFullName());
        res.put("phone", user.getPhone());
        res.put("role", user.getRole().getRoleName());
        if (token != null) res.put("token", token);

        // STAFF
        if (user.getRole().getRoleId() == 2) {
            StaffAssign assign = staffAssignRepository
                    .findFirstByUser_UserIdAndIsActiveTrue(user.getUserId());
            Integer assignedStationId = assign != null ? assign.getStationId() : null;

            res.put("assignedStationId", assignedStationId);
        }

        // DRIVER
        if (user.getRole().getRoleId() == 1) {
            res.put("walletBalance", user.getWalletBalance());

            UserSubscription sub = userSubscriptionRepository
                    .findFirstByUser_UserIdAndStatusAndEndDateAfter(
                            user.getUserId(),
                            UserSubscription.SubscriptionStatus.ACTIVE,
                            LocalDateTime.now()
                    );

            res.put("activeSubscriptionId", sub != null ? sub.getPlan().getId() : null);
            res.put("planName", sub != null ? sub.getPlan().getPlanName() : null);
            res.put("usedSwaps", sub != null ? sub.getUsedSwaps() : 0);
            res.put("maxSwaps", sub != null ? sub.getPlan().getSwapLimit() : 0);
        }

        return res;
    }


}
