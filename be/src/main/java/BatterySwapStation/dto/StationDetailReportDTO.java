package BatterySwapStation.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StationDetailReportDTO {
    private Integer stationId;
    private String stationName;
    private LocalDate reportDate;
    private List<BookingReportItemDTO> bookingDetails;
    private double totalRevenue;
}
