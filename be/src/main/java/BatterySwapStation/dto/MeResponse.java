package BatterySwapStation.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MeResponse {
    private String userId;
    private String fullName;
    private String email;
    private String phone;
    private String role;

    private Integer assignedStationId;     // Staff only
    private Double walletBalance;          // Driver only
    private Long activeSubscriptionId;     // Driver only
    private String planName;               // Driver only
    private Integer usedSwaps;             // Driver only
    private Integer maxSwaps;              // Driver only
}
