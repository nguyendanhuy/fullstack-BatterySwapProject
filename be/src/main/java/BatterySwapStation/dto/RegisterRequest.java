package BatterySwapStation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import jakarta.validation.constraints.*;

@Data
public class RegisterRequest {

    @Schema(example = "Nguyen Van A")
    @NotBlank(message = "Họ và tên không được để trống")
    @Pattern(regexp = "^[\\p{L} ]+$", message = "Họ và tên chỉ được chứa chữ cái và khoảng trắng")
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^[0-9]{10,11}$", message = "Số điện thoại phải từ 10-11 chữ số")
    private String phone;

    @NotBlank(message = "Địa chỉ không được để trống")
    private String address;

//    @NotNull(message = "Loại tài khoản không được để trống")
//    private Integer roleId;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu phải ít nhất 6 ký tự")
    private String password;

    @NotBlank(message = "Xác nhận mật khẩu không được để trống")
    private String confirmPassword;
}
