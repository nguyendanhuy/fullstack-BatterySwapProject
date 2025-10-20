package BatterySwapStation.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FlexibleBatchBookingRequest {

    @NotNull(message = "Danh sách booking không được null")
    @Size(min = 1, max = 3, message = "Chỉ cho phép từ 1-3 booking")
    @Valid
    private List<BookingRequest> bookings;
}