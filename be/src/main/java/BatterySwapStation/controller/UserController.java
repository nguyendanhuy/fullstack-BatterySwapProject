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
}