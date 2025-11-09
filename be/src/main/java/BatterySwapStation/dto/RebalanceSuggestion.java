package BatterySwapStation.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RebalanceSuggestion {
    private String from;         // Trạm gửi
    private String to;           // Trạm nhận
    private int quantity;        // Số lượng pin
    private String reason;       // Lý do gợi ý
    private int confidence;      // Độ tin cậy (%)
    private String priority;     // Ưu tiên cao/trung bình/thấp
}
