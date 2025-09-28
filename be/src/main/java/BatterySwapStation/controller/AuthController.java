package BatterySwapStation.controller;

import BatterySwapStation.dto.AuthResponse;
import BatterySwapStation.dto.LoginRequest;
import BatterySwapStation.dto.RegisterRequest;
import BatterySwapStation.dto.RoleDTO;
import BatterySwapStation.entity.Role;
import BatterySwapStation.entity.User;
import BatterySwapStation.service.AuthService;
import BatterySwapStation.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserService userService;
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        User user = userService.registerUser(req);
        return ResponseEntity.ok(Map.of(
                "message", "Đăng ký thành công",
                "userId", user.getUserId()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PutMapping("/role/{userId}")
    public ResponseEntity<?> updateUserRole(
            @PathVariable String userId,
            @RequestBody RoleDTO roleDTO) {

        try {
            boolean updated = authService.updateUserRole(userId, roleDTO);
            if (updated) {
                return ResponseEntity.ok("Role updated successfully!");
            } else {
                return ResponseEntity.badRequest().body("User or Role not found!");
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

}

