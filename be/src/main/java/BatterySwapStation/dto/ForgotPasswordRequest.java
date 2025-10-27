package BatterySwapStation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ForgotPasswordRequest {

    @Schema(example = "driver001@gmail.com", description = "Email người dùng cần đặt lại mật khẩu")
    private String email;
}
