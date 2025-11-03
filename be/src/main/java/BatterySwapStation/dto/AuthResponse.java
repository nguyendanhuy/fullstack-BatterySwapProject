package BatterySwapStation.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String message; // login có, /me set null hoặc "OK"
    private String userId;
    private String email;
    private String fullName;
    private String phone;
    private String role;
    private String token; // /me có thể null

    private Integer assignedStationId; // Staff
    private Long activeSubscriptionId; // Driver
    private Double walletBalance;      // Driver
    private String planName;
    private Integer usedSwaps;
    private Integer maxSwaps;
}
