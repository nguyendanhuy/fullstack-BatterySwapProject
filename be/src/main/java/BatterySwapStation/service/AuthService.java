package BatterySwapStation.service;

import BatterySwapStation.dto.RoleDTO;
import BatterySwapStation.entity.StaffAssign;
import BatterySwapStation.entity.UserSubscription;
import BatterySwapStation.repository.StaffAssignRepository;
import BatterySwapStation.repository.UserSubscriptionRepository;
import BatterySwapStation.utils.UserIdGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import BatterySwapStation.dto.LoginRequest;
import BatterySwapStation.dto.AuthResponse;
import BatterySwapStation.entity.Role;
import BatterySwapStation.entity.User;
import BatterySwapStation.repository.RoleRepository;
import BatterySwapStation.repository.UserRepository;
import BatterySwapStation.dto.GoogleUserInfo;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

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

    // 🔹 Đăng nhập thường
    public AuthResponse login(LoginRequest req) {
        User user = userService.findByEmail(req.getEmail());
        if (user == null) throw new RuntimeException("Email không tồn tại");
        if (!userService.checkPassword(req.getPassword(), user.getPassword()))
            throw new RuntimeException("Mật khẩu không đúng");
        if (!user.isActive())
            throw new RuntimeException("Tài khoản đã bị vô hiệu hóa");
        if (!user.isVerified())
            throw new RuntimeException("Bạn chưa xác thực email");

        Integer assignedStationId = null;
        Long activeSubscriptionId = null;
        Double walletBalance = null;
        String planName = null;
        Integer usedSwaps = null;

        // Staff
        if (user.getRole().getRoleId() == 2) {
            StaffAssign assign = staffAssignRepository.findFirstByUser_UserIdAndIsActiveTrue(user.getUserId());
            if (assign != null) assignedStationId = assign.getStationId();
        }

        // Driver
        if (user.getRole().getRoleId() == 1) {
            walletBalance = user.getWalletBalance();
            UserSubscription sub = userSubscriptionRepository
                    .findFirstByUser_UserIdAndStatusAndEndDateAfter(
                            user.getUserId(),
                            UserSubscription.SubscriptionStatus.ACTIVE,
                            LocalDateTime.now()
                    );

            if (sub != null && sub.getPlan() != null) {
                activeSubscriptionId = sub.getPlan().getId();
                planName = sub.getPlan().getPlanName();
                usedSwaps = sub.getUsedSwaps();
            }
        }

        String token = jwtService.generateToken(
                user.getUserId(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().getRoleName(),
                assignedStationId,
                activeSubscriptionId
        );

        return new AuthResponse(
                "Đăng nhập thành công",
                user.getUserId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getRole().getRoleName(),
                token,
                assignedStationId,
                activeSubscriptionId,
                walletBalance,
                planName,
                usedSwaps
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

    //  Login bằng Google
    @Transactional
    public AuthResponse handleGoogleLogin(GoogleUserInfo info) {
        User user = userRepository.findByEmail(info.getEmail());
        boolean isNew = false;

        if (user == null) {
            Role defaultRole = roleRepository.findByRoleName("DRIVER");
            if (defaultRole == null) throw new IllegalStateException("Role DRIVER chưa tồn tại");

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

        if (!user.isActive())
            throw new RuntimeException("Tài khoản đã bị vô hiệu hóa");
        if (!user.isVerified())
            throw new RuntimeException("Bạn chưa xác thực email Google");

        Integer assignedStationId = null;
        Long activeSubscriptionId = null;
        Double walletBalance = null;
        String planName = null;
        Integer usedSwaps = null;

        // Staff
        if (user.getRole().getRoleId() == 2) {
            StaffAssign assign = staffAssignRepository.findFirstByUser_UserIdAndIsActiveTrue(user.getUserId());
            if (assign != null) assignedStationId = assign.getStationId();
        }

        // Driver
        if (user.getRole().getRoleId() == 1) {
            walletBalance = user.getWalletBalance();
            UserSubscription sub = userSubscriptionRepository
                    .findFirstByUser_UserIdAndStatusAndEndDateAfter(
                            user.getUserId(),
                            UserSubscription.SubscriptionStatus.ACTIVE,
                            LocalDateTime.now()
                    );

            if (sub != null && sub.getPlan() != null) {
                activeSubscriptionId = sub.getPlan().getId();
                planName = sub.getPlan().getPlanName();
                usedSwaps = sub.getUsedSwaps();
            }
        }

        String token = jwtService.generateToken(
                user.getUserId(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().getRoleName(),
                assignedStationId,
                activeSubscriptionId
        );

        String msg = isNew
                ? "Đăng ký Google thành công. Vui lòng cập nhật SĐT & địa chỉ"
                : "Đăng nhập thành công";

        return new AuthResponse(
                msg,
                user.getUserId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getRole().getRoleName(),
                token,
                assignedStationId,
                activeSubscriptionId,
                walletBalance,
                planName,
                usedSwaps
        );

    }
}
