package BatterySwapStation.dto;
import lombok.Data;
import java.util.List;
@Data

public class DockBatteryGroupDTO {
    private String dockName;
    private List<SlotBatteryDTO> slots;
}
