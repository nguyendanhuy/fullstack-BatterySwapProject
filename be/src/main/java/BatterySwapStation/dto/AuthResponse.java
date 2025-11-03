package BatterySwapStation.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL) // ✅ Hide null fields
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
    private Double walletBalance;      // Driver
    private String planName;           // Driver
    private Integer usedSwaps;         // Driver
    private Integer maxSwaps;          // Driver
}
