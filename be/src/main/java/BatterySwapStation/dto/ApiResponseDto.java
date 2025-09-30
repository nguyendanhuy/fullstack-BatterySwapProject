package BatterySwapStation.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ApiResponseDto {
    private boolean success;
    private String message;
    private Object data;

    public ApiResponseDto(boolean success, String message) {
        this.success = success;
        this.message = message;
        this.data = null;
    }
}