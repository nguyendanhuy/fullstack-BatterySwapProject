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
            throw new RuntimeException("Ban đã bị ban khỏi server. Vui lòng liên hệ quản trị viên");
        if (!user.isVerified())
            throw new RuntimeException("Bạn chưa xác thực email");

        Integer assignedStationId = null;
        Long activeSubscriptionId = null;

        // 🔹 Nếu là Staff
        if (user.getRole().getRoleId() == 2) {
            StaffAssign assign = staffAssignRepository.findFirstByUser_UserIdAndIsActiveTrue(user.getUserId());
            if (assign != null) assignedStationId = assign.getStationId();
        }

        // 🔹 Nếu là Driver
        if (user.getRole().getRoleId() == 1) {
            UserSubscription sub = userSubscriptionRepository
                    .findFirstByUser_UserIdAndStatusAndEndDateAfter(
                            user.getUserId(),
                            UserSubscription.SubscriptionStatus.ACTIVE,
                            LocalDateTime.now()
                    );
            if (sub != null && sub.getPlan() != null) {
                activeSubscriptionId = sub.getPlan().getId();
            }
        }

        // Token mới gắn thêm stationId / subscriptionId
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
                user.getRole().getRoleId() == 1 ? user.getWalletBalance() : null // ✅ chỉ driver
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
            if (defaultRole == null) {
                throw new IllegalStateException("Role DRIVER chưa tồn tại trong hệ thống");
            }

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

        // Nếu là Staff (trường hợp Google Staff)
        if (user.getRole().getRoleId() == 2) {
            StaffAssign assign = staffAssignRepository.findFirstByUser_UserIdAndIsActiveTrue(user.getUserId());
            if (assign != null) assignedStationId = assign.getStationId();
        }

        // Nếu là Driver
        if (user.getRole().getRoleId() == 1) {
            UserSubscription sub = userSubscriptionRepository
                    .findFirstByUser_UserIdAndStatusAndEndDateAfter(
                            user.getUserId(),
                            UserSubscription.SubscriptionStatus.ACTIVE,
                            LocalDateTime.now()
                    );
            if (sub != null && sub.getPlan() != null) {
                activeSubscriptionId = sub.getPlan().getId();
            }
        }

        // Token mới gắn thêm stationId / subscriptionId
        String token = jwtService.generateToken(
                user.getUserId(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().getRoleName(),
                assignedStationId,
                activeSubscriptionId
        );

        String message = isNew
                ? "Đăng ký mới thành công, vui lòng bổ sung SĐT và địa chỉ sau nhé"
                : "Đăng nhập thành công";

        return new AuthResponse(
                message,
                user.getUserId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getRole().getRoleName(),
                token,
                assignedStationId,
                activeSubscriptionId,
                user.getRole().getRoleId() == 1 ? user.getWalletBalance() : null
        );
    }
}
