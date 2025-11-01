package BatterySwapStation.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class TicketRequest {

    @NotNull(message = "bookingId là bắt buộc")
    private Long bookingId;

    @NotBlank(message = "staffId là bắt buộc")
    private String staffId;

    @NotBlank(message = "title là bắt buộc")
    private String title;

    @NotBlank(message = "description là bắt buộc")
    private String description;

    @NotBlank(message = "disputeReason là bắt buộc")
    private String disputeReason;

    @NotNull(message = "stationId là bắt buộc")
    private Integer stationId;
}