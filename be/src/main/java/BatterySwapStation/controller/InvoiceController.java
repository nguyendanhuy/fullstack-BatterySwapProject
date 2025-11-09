package BatterySwapStation.controller;

import BatterySwapStation.dto.ApiResponse;
import BatterySwapStation.dto.InvoiceSimpleResponseDTO;
import BatterySwapStation.entity.SystemPrice;
import BatterySwapStation.repository.InvoiceRepository;
import BatterySwapStation.service.InvoiceService;
import BatterySwapStation.entity.Invoice;
import BatterySwapStation.entity.Battery;
import BatterySwapStation.entity.Booking;
import BatterySwapStation.repository.BatteryRepository;
import BatterySwapStation.repository.BookingRepository;
import BatterySwapStation.service.SystemPriceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
@Tag(name = "Invoice API", description = "API quản lý hóa đơn - Response đơn giản")
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final BatteryRepository batteryRepository;
    private final BookingRepository bookingRepository;
    private final SystemPriceService systemPriceService;
    private final InvoiceRepository invoiceRepository;

    @GetMapping("/{invoiceId}")
    @Operation(summary = "Lấy thông tin invoice đơn giản", description = "Trả về thông tin invoice cơ bản, không có nested objects")
    public ResponseEntity<Map<String, Object>> getInvoiceSimple(
            @PathVariable @Parameter(description = "ID của invoice") Long invoiceId) {
        try {
            Invoice invoice = invoiceRepository.findByIdWithFullDetails(invoiceId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn với ID: " + invoiceId));


            Map<String, Object> response = new HashMap<>();
            response.put("invoiceId", invoice.getInvoiceId());
            response.put("userId", invoice.getUserId() != null ? invoice.getUserId() : "");
            response.put("totalAmount", invoice.getTotalAmount() != null ? invoice.getTotalAmount() : 0.0);
            response.put("pricePerSwap", invoice.getPricePerSwap() != null ? invoice.getPricePerSwap() : 0.0);
            response.put("numberOfSwaps", invoice.getNumberOfSwaps() != null ? invoice.getNumberOfSwaps() : 0);
            response.put("createdDate", invoice.getCreatedDate() != null ? invoice.getCreatedDate().toString() : "");
            response.put("status", "ACTIVE");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Lỗi lấy thông tin invoice");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả invoice", description = "Trả về danh sách invoice đơn giản")
    public ResponseEntity<Map<String, Object>> getAllInvoicesSimple() {
        try {
            List<Invoice> invoices = invoiceService.getAllInvoices();

            List<Map<String, Object>> simpleInvoices = new ArrayList<>();
            for (Invoice invoice : invoices) {
                Map<String, Object> invoiceMap = new HashMap<>();
                invoiceMap.put("invoiceId", invoice.getInvoiceId());
                invoiceMap.put("userId", invoice.getUserId() != null ? invoice.getUserId() : "");
                invoiceMap.put("totalAmount", invoice.getTotalAmount() != null ? invoice.getTotalAmount() : 0.0);
                invoiceMap.put("numberOfSwaps", invoice.getNumberOfSwaps() != null ? invoice.getNumberOfSwaps() : 0);
                invoiceMap.put("createdDate", invoice.getCreatedDate() != null ? invoice.getCreatedDate().toString() : "");
                simpleInvoices.add(invoiceMap);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("total", invoices.size());
            response.put("invoices", simpleInvoices);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Lỗi lấy danh sách invoice");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Lấy invoice của user", description = "Trả về danh sách invoice của một user cụ thể")
    public ResponseEntity<Map<String, Object>> getUserInvoices(
            @PathVariable @Parameter(description = "ID của user") String userId) {

        try {
            // ⚡ DÙNG JOIN FETCH ĐỂ LẤY TOÀN BỘ DỮ LIỆU LIÊN QUAN
            List<Invoice> userInvoices = invoiceRepository.findByUserIdWithFullDetails(userId);

            // ⚡ KHÔNG GỌI SERVICE.getInvoiceSimple() (vì sẽ query lại DB từng invoice)
            // → Gọi method mới, dùng dữ liệu đã fetch sẵn
            List<InvoiceSimpleResponseDTO> invoiceDTOs = userInvoices.stream()
                    .map(invoiceService::buildInvoiceSimpleFromFetched)
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("userId", userId);
            response.put("total", invoiceDTOs.size());
            response.put("invoices", invoiceDTOs);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Lỗi lấy invoice của user");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }




    @DeleteMapping("/{invoiceId}")
    @Operation(summary = "Xóa invoice", description = "Xóa một invoice theo ID")
    public ResponseEntity<Map<String, Object>> deleteInvoice(
            @PathVariable @Parameter(description = "ID của invoice") Long invoiceId) {
        try {
            invoiceService.deleteInvoice(invoiceId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Xóa invoice thành công");
            response.put("invoiceId", invoiceId);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Lỗi xóa invoice");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/create")
    @Operation(summary = "Tạo invoice từ danh sách pin", description = "Tạo invoice ngay khi user chọn pin, trả về invoiceId và tổng tiền")
    public ResponseEntity<Map<String, Object>> createInvoiceFromBatteries(
            @RequestParam @Parameter(description = "ID của user") String userId,
            @RequestBody List<String> batteryIds) {

        try {
            if (batteryIds == null || batteryIds.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("error", "Danh sách pin không được để trống");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            // ✅ BƯỚC 2: [ĐÃ SỬA] Lấy giá đổi pin tiêu chuẩn (logic mới)
            double standardSwapPrice = systemPriceService.getPriceByType(SystemPrice.PriceType.BATTERY_SWAP);

            // Tính tổng tiền từ danh sách pin
            double totalAmount = 0.0;
            List<Map<String, Object>> batteryDetails = new ArrayList<>();
            List<Battery> batteriesToUpdate = new ArrayList<>(); // <-- TỐI ƯU HÓA: Tạo list chờ

            for (String batteryId : batteryIds) {
                // Lấy battery thực tế từ database
                Battery battery = batteryRepository.findById(batteryId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy pin: " + batteryId));

                // Kiểm tra pin có sẵn không
                if (!battery.isAvailableForBooking()) {
                    throw new RuntimeException("Pin " + batteryId + " không khả dụng");
                }

                // Tính tiền cho pin - SỬ DỤNG GIÁ CỐ ĐỊNH
                totalAmount += standardSwapPrice;

                // ⚠️ CẢNH BÁO LOGIC:
                // Việc set IN_USE ở đây rất nguy hiểm. Nếu user tạo invoice
                // nhưng không thanh toán (bị timeout), pin này sẽ bị kẹt
                // ở trạng thái IN_USE. Bạn nên xem xét lại logic này.
                battery.setBatteryStatus(Battery.BatteryStatus.IN_USE);
                batteriesToUpdate.add(battery); // <-- TỐI ƯU HÓA: Thêm vào list, chưa save

                // Thêm thông tin pin thực tế
                Map<String, Object> batteryInfo = new HashMap<>();
                batteryInfo.put("batteryId", battery.getBatteryId());
                batteryInfo.put("batteryType", battery.getBatteryType().toString());
                batteryInfo.put("price", standardSwapPrice); // <--- Dùng giá cố định
                batteryInfo.put("stationId", battery.getStationId());
                batteryDetails.add(batteryInfo);
            }

            // ✅ TỐI ƯU HÓA: Cập nhật trạng thái tất cả pin 1 LẦN
            batteryRepository.saveAll(batteriesToUpdate);

            // Tạo invoice
            Invoice invoice = new Invoice();
            invoice.setUserId(userId);
            invoice.setTotalAmount(totalAmount);

            // ✅ SỬA LOGIC: Gán giá chuẩn cho 'pricePerSwap'
            // (Thay vì 'totalAmount / batteryIds.size()')
            invoice.setPricePerSwap(standardSwapPrice);

            invoice.setNumberOfSwaps(batteryIds.size());
            invoice.setCreatedDate(java.time.LocalDateTime.now());

            // Gọi service (đã sửa) để lưu invoice (sẽ không bị lỗi số 0)
            Invoice savedInvoice = invoiceService.createInvoice(invoice);

            // Trả về response đơn giản
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("invoiceId", savedInvoice.getInvoiceId());
            response.put("userId", userId);
            response.put("totalAmount", savedInvoice.getTotalAmount());
            response.put("pricePerSwap", savedInvoice.getPricePerSwap());
            response.put("numberOfSwaps", savedInvoice.getNumberOfSwaps());
            response.put("status", savedInvoice.getInvoiceStatus().toString()); // Lấy status từ DB
            response.put("batteriesCount", batteryIds.size());
            response.put("message", "Invoice được tạo thành công");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Tạo invoice thất bại");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/create-from-booking")
    @Operation(summary = "Tạo invoice từ 1 booking", description = "Tạo invoice mới từ một booking đã thanh toán")
    public ResponseEntity<Map<String, Object>> createInvoiceFromBooking(
            @RequestParam @Parameter(description = "ID của booking") Long bookingId) {
        try {
            // Lấy booking trực tiếp từ repository
            Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy booking với ID: " + bookingId));

            // Gọi service để tạo invoice từ booking
            Invoice invoice = invoiceService.createInvoiceForBooking(booking);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Tạo invoice từ booking thành công");
            response.put("invoiceId", invoice.getInvoiceId());
            response.put("bookingId", bookingId);
            response.put("totalAmount", invoice.getTotalAmount());
            response.put("numberOfSwaps", invoice.getNumberOfSwaps());
            response.put("createdDate", invoice.getCreatedDate().toString());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Không thể tạo invoice từ booking");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/create-from-multiple-bookings")
    @Operation(summary = "Tạo invoice từ nhiều booking", description = "Tạo 1 invoice chung từ nhiều booking")
    public ResponseEntity<Map<String, Object>> createInvoiceFromMultipleBookings(
            @RequestBody @Parameter(description = "Danh sách ID của các booking") List<Long> bookingIds) {
        try {
            if (bookingIds == null || bookingIds.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("error", "Danh sách booking không được để trống");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            // Gọi service để tạo invoice từ nhiều booking
            Invoice invoice = invoiceService.createInvoiceWithBookings(bookingIds);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Tạo invoice từ " + bookingIds.size() + " booking thành công");
            response.put("invoiceId", invoice.getInvoiceId());
            response.put("bookingIds", bookingIds);
            response.put("totalAmount", invoice.getTotalAmount());
            response.put("numberOfSwaps", invoice.getNumberOfSwaps());
            response.put("createdDate", invoice.getCreatedDate().toString());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Không thể tạo invoice từ danh sách booking");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * API để lọc Invoices theo trạng thái
     * Ví dụ: GET /api/invoices/status/PAID
     * GET /api/invoices/status/PENDING
     * GET /api/invoices/status/PAYMENTFAILED
     */
    @GetMapping("/status/{status}")
    @Operation(
            summary = "Lọc hóa đơn theo trạng thái",
            description = "Lấy danh sách hóa đơn theo trạng thái (PENDING, PAID, PAYMENTFAILED)"
    )
    public ResponseEntity<?> getInvoicesByStatus(
            @Parameter(description = "Trạng thái cần lọc (PENDING, PAID, PAYMENTFAILED)")
            @PathVariable String status) {

        try {
            // Gọi service (service sẽ throw IllegalArgumentException nếu status không hợp lệ)
            List<InvoiceSimpleResponseDTO> invoices = invoiceService.getInvoicesByStatus(status);

            // Kiểm tra kết quả
            if (invoices.isEmpty()) {
                //  Status hợp lệ nhưng không có invoice
                return ResponseEntity.ok(new ApiResponse(
                        true,
                        String.format("Không tìm thấy hóa đơn nào có trạng thái '%s'", status.toUpperCase()),
                        new ArrayList<>()
                ));
            }

            //  Có invoice
            return ResponseEntity.ok(new ApiResponse(
                    true,
                    String.format("Tìm thấy %d hóa đơn có trạng thái '%s'", invoices.size(), status.toUpperCase()),
                    invoices
            ));

        } catch (IllegalArgumentException e) {
            //  Status không hợp lệ (service đã throw)
            return ResponseEntity.badRequest().body(new ApiResponse(
                    false,
                    e.getMessage()
            ));
        } catch (Exception e) {
            //  Lỗi khác
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ApiResponse(
                    false,
                    "Lỗi hệ thống: " + e.getMessage()
            ));
        }
    }

    /**
     * API để người dùng chủ động hủy một invoice PENDING
     * Ví dụ: POST /api/invoices/10028/cancel
     */
    @PostMapping("/{id}/cancel")
    @Operation(summary = "Hủy Invoice (cho User)",
            description = "Cho phép người dùng hủy một invoice đang ở trạng thái PENDING. " +
                    "Tất cả booking và payment liên quan sẽ bị hủy theo.")
    public ResponseEntity<ApiResponse> cancelInvoice(
            @Parameter(description = "ID của invoice cần hủy") @PathVariable("id") Long invoiceId) {

        try {
            // Gọi service
            invoiceService.userCancelInvoice(invoiceId);

            return ResponseEntity.ok(new ApiResponse(
                    true,
                    "Invoice ID " + invoiceId + " và các booking liên quan đã được hủy thành công."
            ));

        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse(false, e.getMessage()));
        } catch (IllegalStateException e) {
            // Bắt lỗi (ví dụ: "Invoice đã được thanh toán")
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ApiResponse(false, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "Lỗi máy chủ: " + e.getMessage()));
        }
    }
}
