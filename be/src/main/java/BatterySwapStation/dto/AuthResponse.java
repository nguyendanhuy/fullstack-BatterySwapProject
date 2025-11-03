package BatterySwapStation.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String message;
    private String userId;
    private String email;
    private String fullName;
    private String phone;
    private String role;
    private String token;

    private Integer assignedStationId; // Staff
    private Long activeSubscriptionId; // Driver
    private Double walletBalance;      // ✅ Driver mới có
    private String planName;     // ✅ thêm
    private Integer usedSwaps;
    private Integer totalSwaps;

}

