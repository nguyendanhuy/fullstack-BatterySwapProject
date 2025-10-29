package BatterySwapStation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateStaffRequest {

    @Schema(example = "Ten")
    @NotBlank(message = "Tên nhân viên không được để trống")
    @Pattern(regexp = "^[\\p{L} ]+$", message = "Tên nhân viên chỉ được chứa chữ cái và khoảng trắng")
    private String name;

    @Schema(example = "staff001@gmail.com")
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @Schema(example = "123456")
    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự")
    private String password;

    @Schema(example = "1", description = "ID của trạm mà staff được gán (có thể null nếu chưa gán)")
    private Integer stationId;
}
