package BatterySwapStation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResetPasswordRequest {

    @Schema(example = "", description = "Token đặt lại mật khẩu được gửi qua email")
    private String token;

    @Schema(example = "123456", description = "Mật khẩu mới")
    private String newPassword;

    @Schema(example = "123456", description = "Xác nhận lại mật khẩu mới")
    private String confirmPassword;
}
