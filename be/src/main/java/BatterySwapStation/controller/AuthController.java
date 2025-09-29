package BatterySwapStation.controller;

import BatterySwapStation.dto.*;

import BatterySwapStation.entity.*;
import BatterySwapStation.service.*;
import BatterySwapStation.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor

public class AuthController {

    private final UserService userService;
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        
        User user = userService.registerUser(req);
        return ResponseEntity.ok(Map.of(
                "message", "Đăng ký thành công",
                "userId", user.getUserId()
        ));
    }


    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PutMapping("/role/{userId}")
    public ResponseEntity<?> updateUserRole(
            @PathVariable String userId,
            @RequestBody RoleDTO roleDTO) {
        boolean updated = authService.updateUserRole(userId, roleDTO);
        if (updated) {
            return ResponseEntity.ok("Role updated successfully!");
        } else {
            return ResponseEntity.badRequest().body("User or Role not found!");
        }
    }

}

