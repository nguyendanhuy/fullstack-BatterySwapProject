package BatterySwapStation.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StationResponseDTO {

    private Integer stationId;
    private String stationName;
    private String address;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private boolean isActive;

    // Tổng số pin (AVAILABLE + CHARGING)
    private int totalBatteries;

    private int availableCount;
    private int chargingCount;

    // Chi tiết từng loại pin
    private List<BatteryTypeRow> batteries;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BatteryTypeRow {
        private String batteryType; // enum name
        private int available;
        private int charging;

        public int getTotal() {
            return available + charging;
        }
    }
}
