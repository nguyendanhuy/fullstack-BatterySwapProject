package BatterySwapStation.controller;

import BatterySwapStation.dto.*;
import BatterySwapStation.repository.BatteryRepository;
import BatterySwapStation.repository.BookingRepository;
import BatterySwapStation.service.SwapService;
import BatterySwapStation.entity.Battery;
import BatterySwapStation.entity.Booking;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/swaps")
@RequiredArgsConstructor
@Tag(name = "SWAP")
public class SwapController {

    private final SwapService swapService;
    private final BookingRepository bookingRepository;
    private final BatteryRepository batteryRepository;

    // ====================== CHECK MODEL BEFORE SWAP ======================
    @PostMapping("/checkBatteryModel")
    public ResponseEntity<ApiResponse> checkBatteryModel(@RequestBody BatteryModelCheckRequest req) {
        ApiResponse response = swapService.checkBatteryModel(req);
        return ResponseEntity.ok(response);
    }



    // ====================== COMMIT SWAP ======================
    @PostMapping("/commit")
    public ResponseEntity<?> commitSwap(@RequestBody SwapRequest request) {
        try {
            Object response = swapService.commitSwap(request);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", response
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    // ====================== CANCEL SWAP ======================
    @PostMapping("/cancel")
    public ResponseEntity<?> cancelSwap(@RequestBody SwapCancelRequest request) {
        try {
            if (request.getBookingId() == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Thiếu bookingId để hủy swap."
                ));
            }

            Object response = swapService.cancelSwapByBooking(request.getBookingId());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", response
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }
    @Operation (summary = "Lấy danh sách các lần swap theo trạm")
    @GetMapping
    public ResponseEntity<?> getSwapsByStation(@RequestParam(name = "stationId") Integer stationId) {
        try {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", swapService.getSwapsByStation(stationId)
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "Lỗi lấy danh sách swap: " + e.getMessage()
            ));
        }
    }


}
