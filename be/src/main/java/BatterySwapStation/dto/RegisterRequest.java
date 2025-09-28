package BatterySwapStation.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String fullName;
    private String email;
    private String phone;
    private String address;
    private String password;
    private int roleId;
}
