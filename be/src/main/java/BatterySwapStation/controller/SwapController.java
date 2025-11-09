package BatterySwapStation.controller;

import BatterySwapStation.dto.*;
import BatterySwapStation.repository.BatteryRepository;
import BatterySwapStation.repository.BookingRepository;
import BatterySwapStation.service.SwapService;
import BatterySwapStation.entity.Battery;
import BatterySwapStation.entity.Booking;
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
        try {
            Booking booking = bookingRepository.findById(req.getBookingId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy booking #" + req.getBookingId()));

            List<String> batteryIds = req.getBatteryIds();
            if (batteryIds == null || batteryIds.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse(false, "Thiếu danh sách mã pin cần kiểm tra."));
            }

            List<Map<String, Object>> results = new ArrayList<>();
            for (String batteryId : batteryIds) {
                Map<String, Object> info = new HashMap<>();
                info.put("batteryId", batteryId);

                Optional<Battery> opt = batteryRepository.findById(batteryId);
                if (opt.isEmpty()) {
                    info.put("valid", false);
                    info.put("message", "Không tìm thấy pin #" + batteryId);
                    results.add(info);
                    continue;
                }

                Battery battery = opt.get();
                if (battery.getBatteryType() == null) {
                    info.put("valid", false);
                    info.put("message", "Pin chưa xác định loại model.");
                    results.add(info);
                    continue;
                }

                boolean same = battery.getBatteryType().name()
                        .equalsIgnoreCase(booking.getBatteryType());
                info.put("valid", same);
                info.put("message", same
                        ? "Pin trùng model (" + battery.getBatteryType().name() + ")"
                        : "Pin khác model (" + battery.getBatteryType().name() + " ≠ " + booking.getBatteryType() + ")");
                results.add(info);
            }

            boolean allMatch = results.stream().allMatch(r -> Boolean.TRUE.equals(r.get("valid")));
            return ResponseEntity.ok(
                    new ApiResponse(allMatch,
                            allMatch ? "Tất cả pin đều trùng model, có thể swap."
                                    : "Một hoặc nhiều pin không trùng model.",
                            results)
            );
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse(false, "Lỗi kiểm tra model: " + e.getMessage()));
        }
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

    @GetMapping
    public ResponseEntity<List<SwapListItemDTO>> getSwapsByStation(
            @RequestParam(name = "stationId") Integer stationId
    ) {
        return ResponseEntity.ok(swapService.getSwapsByStation(stationId));
    }



}
