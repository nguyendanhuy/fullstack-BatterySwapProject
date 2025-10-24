package BatterySwapStation.service;

import BatterySwapStation.dto.ChangePasswordRequest;
import BatterySwapStation.dto.ChangePhoneRequest;
import BatterySwapStation.dto.RegisterRequest;
import BatterySwapStation.entity.Role;
import BatterySwapStation.entity.User;
import BatterySwapStation.repository.RoleRepository;
import BatterySwapStation.repository.UserRepository;
import BatterySwapStation.utils.UserIdGenerator;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;


import java.time.LocalDateTime;

import static BatterySwapStation.utils.NameFormatter.formatFullName;

@Service
@Slf4j
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

    /**
     * API 1: Logic đổi mật khẩu
     */
    @Transactional
    public void changePassword(UserDetails userDetails, ChangePasswordRequest request) {
        // 1) Lấy user
        User user = getUserFromDetails(userDetails);

        // 2) Kiểm tra new/confirm (giữ chặt ở BE phòng FE bỏ sót)
        if (!StringUtils.hasText(request.getNewPassword()) || request.getNewPassword().length() < 6) {
            throw new IllegalArgumentException("Mật khẩu mới phải có ít nhất 6 ký tự.");
        }
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Mật khẩu mới và xác nhận không khớp.");
        }

        // 3) Nếu user đã có mật khẩu -> bắt buộc kiểm tra oldPassword
        String currentHash = user.getPassword(); // có thể null nếu đăng ký Google
        boolean hasExistingPassword = StringUtils.hasText(currentHash);

        if (hasExistingPassword) {
            // bắt buộc nhập oldPassword
            if (!StringUtils.hasText(request.getOldPassword())) {
                throw new IllegalArgumentException("Vui lòng nhập mật khẩu hiện tại.");
            }
            if (!passwordEncoder.matches(request.getOldPassword(), currentHash)) {
                throw new IllegalArgumentException("Mật khẩu cũ không chính xác.");
            }
        }
        // else: chưa có password (đăng ký Google) -> cho đặt lần đầu, bỏ qua kiểm tra oldPassword

        // 4) Mã hoá & lưu
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdateAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("User {} đã đổi/đặt mật khẩu thành công.", user.getUserId());
    }


    /**
     * API 2: Logic đổi số điện thoại
     */
    @Transactional
    public void changePhoneNumber(UserDetails userDetails, ChangePhoneRequest request) {

        // 1. Lấy user
        User user = getUserFromDetails(userDetails);
        String newPhone = request.getNewPhoneNumber();

        // 2. (Quan trọng) Kiểm tra xem SĐT mới đã bị ai khác dùng chưa
        if (userRepository.existsByPhone(newPhone)) {
            // (Bạn cần thêm hàm `existsByPhone` vào UserRepository)
            throw new IllegalArgumentException("Số điện thoại này đã được sử dụng.");
        }

        // 3. Cập nhật SĐT mới
        log.info("User {} đang đổi SĐT từ {} sang {}", user.getUserId(), user.getPhone(), newPhone);
        user.setPhone(newPhone); // (Giả sử hàm set SĐT là setPhone)
        userRepository.save(user);
    }

    /**
     * Hàm helper để lấy Entity User từ UserDetails (token)
     */
    private User getUserFromDetails(UserDetails userDetails) {
        String userId = userDetails.getUsername(); // Giả sử username trong token là userId
        return userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy User: " + userId));
    }


}
