package BatterySwapStation.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StaffCancelBookingRequest {

    @NotBlank(message = "ID nhân viên không được để trống")
    private String staffUserId;

    @NotBlank(message = "Lý do hủy không được để trống")
    private String cancelReason;

    private String notes; // Ghi chú thêm (tùy chọn)
}

