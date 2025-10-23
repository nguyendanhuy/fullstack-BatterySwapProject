package BatterySwapStation.controller;

import BatterySwapStation.entity.SystemPrice;
import BatterySwapStation.service.SystemPriceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data; // <-- Thêm import
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List; // <-- Thêm import
import java.util.Map;
import java.util.stream.Collectors; // <-- Thêm import

@RestController
@RequestMapping("/api/system-price")
@RequiredArgsConstructor
@Tag(name = "System Price Management", description = "[ĐÃ NÂNG CẤP] APIs quản lý các loại giá linh hoạt")
public class SystemPriceController {

    private final SystemPriceService systemPriceService;

    // --- CÁC API MỚI ---

    /**
     * [THAY THẾ /current và /info]
     * Lấy TẤT CẢ các loại giá trong hệ thống.
     */
    @GetMapping("/all")
    @Operation(summary = "Lấy TẤT CẢ loại giá", description = "Lấy danh sách tất cả các loại giá trong hệ thống (BATTERY_SWAP, MONTHLY_SUBSCRIPTION...)")
    public ResponseEntity<Map<String, Object>> getAllPrices() {
        try {
            List<SystemPrice> prices = systemPriceService.getAllPrices();

            // ✅ [ĐÃ SỬA] Thay thế Map.of() bằng new HashMap<>()
            List<Map<String, Object>> priceMaps = prices.stream().map(price -> {
                Map<String, Object> map = new HashMap<>();
                map.put("priceType", price.getPriceType().name());
                map.put("price", price.getPrice());
                map.put("description", price.getDescription());
                map.put("displayName", price.getPriceType().getDisplayName());
                return map; // Trả về Map<String, Object>
            }).collect(Collectors.toList()); // Bây giờ sẽ hoạt động

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "prices", priceMaps,
                    "total", priceMaps.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * [MỚI] Lấy một loại giá cụ thể bằng mã Enum
     */
    @GetMapping("/{priceType}")
    @Operation(summary = "Lấy một loại giá cụ thể", description = "Lấy giá theo mã, ví dụ: BATTERY_SWAP hoặc MONTHLY_SUBSCRIPTION")
    public ResponseEntity<Map<String, Object>> getPriceByType(@PathVariable String priceType) {
        try {
            // Chuyển đổi String (ví dụ: "BATTERY_SWAP") sang Enum
            SystemPrice.PriceType type = SystemPrice.PriceType.valueOf(priceType.toUpperCase());
            SystemPrice price = systemPriceService.getSystemPriceByType(type);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "priceType", price.getPriceType().name(),
                    "price", price.getPrice(),
                    "description", price.getDescription(),
                    "displayName", price.getPriceType().getDisplayName()
            ));
        } catch (IllegalArgumentException e) {
            // Lỗi nếu user gõ sai tên PriceType
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Loại giá không hợp lệ: " + priceType));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * [THAY THẾ /initialize]
     * Tạo một loại giá mới (ví dụ: cho Subscription)
     */
    @PostMapping("/create")
    @Operation(summary = "Tạo một loại giá mới", description = "Tạo một loại giá mới (ví dụ: MONTHLY_SUBSCRIPTION)")
    public ResponseEntity<Map<String, Object>> createPrice(@RequestBody PriceRequest request) {
        try {
            // Xây dựng đối tượng Entity từ Request
            SystemPrice newPrice = SystemPrice.builder()
                    .priceType(request.getPriceType())
                    .price(request.getPrice())
                    .description(request.getDescription())
                    .build();

            SystemPrice savedPrice = systemPriceService.createPrice(newPrice);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Tạo giá thành công",
                    "data", savedPrice
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * [THAY THẾ /update và /reset]
     * Cập nhật giá của một loại giá đã có
     */
    @PutMapping("/update")
    @Operation(summary = "Cập nhật một loại giá", description = "Cập nhật giá hoặc mô tả của một loại giá đã có")
    public ResponseEntity<Map<String, Object>> updatePrice(@RequestBody PriceRequest request) {
        try {
            SystemPrice updatedPrice = systemPriceService.updatePrice(
                    request.getPriceType(),
                    request.getPrice(),
                    request.getDescription()
            );
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Cập nhật giá thành công",
                    "data", updatedPrice
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // --- CÁC API TÍNH TOÁN (ĐÃ SỬA) ---

    @GetMapping("/calculate")
    @Operation(summary = "Tính tổng tiền (cho ĐỔI PIN)", description = "Tính tổng tiền dựa trên số lượng lượt đổi pin (dùng giá BATTERY_SWAP)")
    public ResponseEntity<Map<String, Object>> calculateTotalAmount(
            @RequestParam Integer quantity) {
        try {
            if (quantity == null || quantity <= 0) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Số lượng phải lớn hơn 0"
                ));
            }

            // [ĐÃ SỬA] Hard-code để dùng giá đổi pin tiêu chuẩn
            Double swapPrice = systemPriceService.getPriceByType(SystemPrice.PriceType.BATTERY_SWAP);
            Double totalAmount = swapPrice * quantity;

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "quantity", quantity,
                    "pricePerSwap", swapPrice,
                    "totalAmount", totalAmount,
                    "priceType", SystemPrice.PriceType.BATTERY_SWAP.name()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Lỗi khi tính tổng tiền",
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/calculate")
    @Operation(summary = "Tính tổng tiền (POST, cho ĐỔI PIN)", description = "Tính tổng tiền dựa trên số lượng lượt đổi pin (dùng giá BATTERY_SWAP)")
    public ResponseEntity<Map<String, Object>> calculateTotalAmountPost(@RequestBody CalculateRequest request) {
        try {
            if (request.getQuantity() == null || request.getQuantity() <= 0) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "Số lượng phải lớn hơn 0"
                ));
            }

            // [ĐÃ SỬA] Hard-code để dùng giá đổi pin tiêu chuẩn
            Double swapPrice = systemPriceService.getPriceByType(SystemPrice.PriceType.BATTERY_SWAP);
            Double totalAmount = swapPrice * request.getQuantity();

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "quantity", request.getQuantity(),
                    "pricePerSwap", swapPrice,
                    "totalAmount", totalAmount,
                    "priceType", SystemPrice.PriceType.BATTERY_SWAP.name()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Lỗi khi tính tổng tiền",
                    "message", e.getMessage()
            ));
        }
    }

    // --- DTOs (Cập nhật) ---

    /**
     * DTO (Data Transfer Object) cho request Tạo / Cập nhật giá
     */
    @Data // Thêm Lombok
    public static class PriceRequest {
        private SystemPrice.PriceType priceType; // Bắt buộc phải có
        private Double price;
        private String description;
    }

    /**
     * DTO cho request tính toán
     */
    @Data // Thêm Lombok
    public static class CalculateRequest {
        private Integer quantity;
        // (Xóa 'description' vì không dùng)
    }
}