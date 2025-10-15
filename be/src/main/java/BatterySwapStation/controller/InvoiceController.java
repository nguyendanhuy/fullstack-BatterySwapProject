package BatterySwapStation.controller;

import BatterySwapStation.entity.Invoice;
import BatterySwapStation.service.InvoiceService;
import BatterySwapStation.dto.InvoiceResponseDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/invoices")
@Tag(name = "Invoice Management", description = "APIs quản lý hóa đơn - Xem, tạo, sửa, xóa hóa đơn cho các giao dịch đổi pin")
public class InvoiceController {
    @Autowired
    private InvoiceService invoiceService;

    @GetMapping("/{id}")
    @Operation(
        summary = "Lấy chi tiết hóa đơn",
        description = "Xem thông tin chi tiết của một hóa đơn cụ thể bao gồm: InvoiceId, ngày tạo, tổng tiền, và danh sách các booking liên quan. Dùng khi khách hàng muốn xem lại hóa đơn hoặc admin cần kiểm tra chi tiết."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lấy thông tin hóa đơn thành công"),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy hóa đơn với ID này")
    })
    public ResponseEntity<InvoiceResponseDTO> getInvoice(@PathVariable Long id) {
        InvoiceResponseDTO invoice = invoiceService.getInvoiceDetail(id);
        return ResponseEntity.ok(invoice);
    }

    @PostMapping
    @Operation(
        summary = "Tạo hóa đơn mới",
        description = "Tạo hóa đơn mới cho giao dịch. InvoiceId sẽ tự động tăng dần từ 10000 (10000, 10001, 10002...). Thường được gọi tự động sau khi booking chuyển sang trạng thái COMPLETED hoặc khi khách hàng thanh toán thành công."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Tạo hóa đơn thành công"),
        @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ")
    })
    public ResponseEntity<Invoice> createInvoice(@RequestBody Invoice invoice) {
        Invoice created = invoiceService.createInvoice(invoice);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    @Operation(
        summary = "Cập nhật hóa đơn",
        description = "Chỉnh sửa thông tin hóa đơn đã tạo (ngày tạo, tổng tiền). Dùng khi phát hiện sai sót trong hóa đơn cần điều chỉnh hoặc admin muốn cập nhật thông tin bổ sung."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Cập nhật hóa đơn thành công"),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy hóa đơn với ID này")
    })
    public ResponseEntity<Invoice> updateInvoice(@PathVariable Long id, @RequestBody Invoice invoice) {
        Invoice updated = invoiceService.updateInvoice(id, invoice);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(
        summary = "Xóa hóa đơn",
        description = "Xóa hóa đơn khỏi hệ thống. Dùng khi hóa đơn được tạo nhầm, giao dịch bị hủy bỏ, hoặc admin cần dọn dẹp dữ liệu test/demo không hợp lệ."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Xóa hóa đơn thành công"),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy hóa đơn với ID này")
    })
    public ResponseEntity<Void> deleteInvoice(@PathVariable Long id) {
        invoiceService.deleteInvoice(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @Operation(
        summary = "Lấy danh sách tất cả hóa đơn",
        description = "Xem tất cả các hóa đơn trong hệ thống. Dùng cho admin để quản lý, theo dõi tổng quan các giao dịch, báo cáo doanh thu, hoặc tìm kiếm hóa đơn cụ thể."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lấy danh sách hóa đơn thành công")
    })
    public ResponseEntity<List<Invoice>> getAllInvoices() {
        List<Invoice> invoices = invoiceService.getAllInvoices();
        return ResponseEntity.ok(invoices);
    }
}
