package BatterySwapStation.dto;

import lombok.Data;

@Data
public class TicketResolveRequest {
    // Phương thức/kiểu giải quyết (ví dụ: "REFUND", "REPLACE")
    private String resolutionMethod;

    // Mô tả chi tiết cách giải quyết
    private String resolutionDescription;
}

