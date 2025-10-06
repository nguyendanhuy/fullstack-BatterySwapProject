package BatterySwapStation.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

// DTO để hủy booking
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CancelBookingRequest {

    @NotNull(message = "Cancellation reason is required")
    private String cancellationReason;

}