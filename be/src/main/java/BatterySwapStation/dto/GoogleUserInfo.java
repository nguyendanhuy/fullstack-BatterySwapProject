package BatterySwapStation.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GoogleUserInfo {
    private String name;
    private String email;
    private boolean emailVerified;
}
