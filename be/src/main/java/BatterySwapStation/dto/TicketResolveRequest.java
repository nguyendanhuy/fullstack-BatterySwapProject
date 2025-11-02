package BatterySwapStation.dto;

import BatterySwapStation.entity.DisputeTicket;
import lombok.Data;

@Data
public class TicketResolveRequest {
    // Phương thức/kiểu giải quyết (enum)
    private DisputeTicket.ResolutionMethod resolutionMethod;

    // Mô tả chi tiết cách giải quyết
    private String resolutionDescription;
}

