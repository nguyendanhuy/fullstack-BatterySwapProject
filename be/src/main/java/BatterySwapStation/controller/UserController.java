package BatterySwapStation.controller;

import BatterySwapStation.dto.ChangePasswordRequest;
import BatterySwapStation.dto.ChangePhoneRequest;
import BatterySwapStation.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users/profile") // (FE sẽ gọi vào đường dẫn này)
@RequiredArgsConstructor
@Tag(name = "User Profile", description = "APIs quản lý thông tin cá nhân (đổi SĐT, mật khẩu)")
public class UserController {

    private final UserService userService;

    /**
     * API 1: Đổi mật khẩu
     */
    @PostMapping("/change-password")
    @Operation(summary = "Đổi mật khẩu (cho người đã đăng nhập)")
    public ResponseEntity<Map<String, Object>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        try {
            userService.changePassword(userDetails, request);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Đổi mật khẩu thành công."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    /**
     * API 2: Đổi số điện thoại
     */
    @PutMapping("/change-phone")
    @Operation(summary = "Đổi số điện thoại (cho người đã đăng nhập)")
    public ResponseEntity<Map<String, Object>> changePhoneNumber(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePhoneRequest request
    ) {
        try {
            userService.changePhoneNumber(userDetails, request);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Cập nhật số điện thoại thành công."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

//    @DeleteMapping("/{userId}")
//    //@PreAuthorize("hasRole('ADMIN')") // chỉ admin được xoá user
//    @Operation(summary = "Xoá tài khoản người dùng theo ID")
//    public ResponseEntity<?> deleteUser(@PathVariable String userId) {
//        userService.deleteUserById(userId);
//        return ResponseEntity.ok(Map.of(
//                "success", true,
//                "message", "User deleted successfully"
//        ));
//    }

    @DeleteMapping("/me")
    @Operation(summary = "User tự xoá tài khoản của mình")
    public ResponseEntity<?> deleteMyAccount(@AuthenticationPrincipal User user) {
        userService.deleteUserPermanently(user.getUsername());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Tài khoản của bạn đã bị xoá hoàn toàn"
        ));
    }

}