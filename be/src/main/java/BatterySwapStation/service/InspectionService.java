package BatterySwapStation.service;

import BatterySwapStation.dto.BatteryRealtimeEvent;
import BatterySwapStation.dto.InspectionRequest;
import BatterySwapStation.dto.InspectionResponse;
import BatterySwapStation.dto.InspectionUpdateRequest;
import BatterySwapStation.entity.*;
import BatterySwapStation.repository.*;
import BatterySwapStation.websocket.BatterySocketController;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InspectionService { // ✅ Đổi tên lớp

    // ✅ Giữ lại các Repository cần thiết cho Inspection
    private final BookingRepository bookingRepository;
    private final BatteryRepository batteryRepository;
    private final BatteryInspectionRepository inspectionRepository;
    private final UserRepository userRepository;
    private final DockSlotRepository dockSlotRepository;
    private final BatterySocketController batterySocketController;
    private final ObjectMapper objectMapper = new ObjectMapper();


    // ----------------------------------------------------
    // --- 1. TẠO INSPECTION (POST /inspections) ---
    // ----------------------------------------------------
    @Transactional
    public BatteryInspection createInspection(InspectionRequest request) {

        // ... (Logic kiểm tra dữ liệu đầu vào giữ nguyên) ...

        User staff = userRepository.findById(request.getStaffId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Staff (User) ID: " + request.getStaffId()));

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Booking: " + request.getBookingId()));

        String oldBatteryId = request.getBatteryInId();
        Battery battery = batteryRepository.findById(oldBatteryId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Không tìm thấy (Entity) Pin với ID: " + oldBatteryId
                ));

        // 2. Xác định Status
        BatteryInspection.InspectionStatus inspectionStatus = BatteryInspection.InspectionStatus.PASS;
        if (request.getStatus() != null && !request.getStatus().isEmpty()) {
            try {
                inspectionStatus = BatteryInspection.InspectionStatus.valueOf(request.getStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Trạng thái Inspection không hợp lệ: " + request.getStatus() + ". Phải là PASS hoặc IN_MAINTENANCE.");
            }
        }

        // 3. Status được xác định hoàn toàn bởi staff, không bị ràng buộc với stateOfHealth

        // 4. Cập nhật thông tin pin dựa trên kết quả kiểm tra
        updateBatteryFromInspection(battery, request, inspectionStatus);

        // 5. Tạo và Lưu Inspection (hoạt động như log)
        BatteryInspection inspection = BatteryInspection.builder()
                .booking(booking)
                .battery(battery)
                .staff(staff)
                .inspectionTime(LocalDateTime.now())
                .stateOfHealth(request.getStateOfHealth())
                .physicalNotes(request.getPhysicalNotes())
                .status(inspectionStatus)
                .build();

        return inspectionRepository.save(inspection);
    }

    // -----------------------------------------------------
    // --- 2. LẤY TẤT CẢ INSPECTION (GET /all) ---
    // -----------------------------------------------------
    public List<InspectionResponse> getAllInspections() {
        List<BatteryInspection> inspections = inspectionRepository.findAllByOrderByInspectionTimeDesc();
        return inspections.stream()
                .map(this::convertToInspectionResponse)
                .toList();
    }

    // -------------------------------------------------------
    // --- 3. CẬP NHẬT INSPECTION (PUT /{id}) ---
    // -------------------------------------------------------
    @Transactional
    public InspectionResponse updateInspection(Long inspectionId, InspectionUpdateRequest request) {
        BatteryInspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new EntityNotFoundException("Inspection không tồn tại với ID: " + inspectionId));

        boolean needUpdateBattery = false;
        Battery battery = inspection.getBattery();

        if (request.getStateOfHealth() != null) {
            inspection.setStateOfHealth(request.getStateOfHealth());
            // Cập nhật StateOfHealth cho pin
            battery.setStateOfHealth(request.getStateOfHealth());
            needUpdateBattery = true;
        }
        if (request.getPhysicalNotes() != null) {
            inspection.setPhysicalNotes(request.getPhysicalNotes());
        }

        if (request.getNewStatus() != null) {
            try {
                BatteryInspection.InspectionStatus newStatus =
                        BatteryInspection.InspectionStatus.valueOf(request.getNewStatus().toUpperCase());
                inspection.setStatus(newStatus);
                needUpdateBattery = true;
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Trạng thái Inspection không hợp lệ: " + request.getNewStatus() + ". Phải là PASS hoặc IN_MAINTENANCE.");
            }
        }

        // Cập nhật thông tin pin nếu cần thiết
        if (needUpdateBattery) {
            updateBatteryFromInspectionUpdate(battery, inspection);
        }

        BatteryInspection updatedInspection = inspectionRepository.save(inspection);
        return convertToInspectionResponse(updatedInspection);
    }

    // -------------------------------------------------------------------
    // --- 4. LẤY INSPECTION THEO STAFF (GET /inspections/staff/{id}) ---
    // -------------------------------------------------------------------
    public List<InspectionResponse> getInspectionsByStaff(String staffId) {
        // Cần Repository Method: findByStaff_UserId
        List<BatteryInspection> inspections = inspectionRepository.findByStaffUserId(staffId);

        return inspections.stream()
                .map(this::convertToInspectionResponse)
                .collect(Collectors.toList());
    }

    // ---------------------------------
    // --- HÀM HELPER (CHUYỂN ĐỔI DTO) ---
    // ---------------------------------
    private InspectionResponse convertToInspectionResponse(BatteryInspection inspection) {
        InspectionResponse ins = new InspectionResponse();
        ins.setId(inspection.getId());
        ins.setInspectionTime(inspection.getInspectionTime());
        ins.setStateOfHealth(inspection.getStateOfHealth());
        ins.setPhysicalNotes(inspection.getPhysicalNotes());


        if (inspection.getBattery() != null) {
            ins.setBatteryId(inspection.getBattery().getBatteryId());
        }

        if (inspection.getStatus() != null) {
            ins.setStatus(inspection.getStatus().name());
        }

        return ins;
    }

    // ---------------------------------
    // --- HÀM CẬP NHẬT THÔNG TIN PIN ---
    // ---------------------------------
    private void updateBatteryFromInspection(Battery battery, InspectionRequest request,
                                           BatteryInspection.InspectionStatus inspectionStatus) {

        // Cập nhật StateOfHealth nếu có
        if (request.getStateOfHealth() != null) {
            battery.setStateOfHealth(request.getStateOfHealth());
        }

        // Cập nhật trạng thái pin dựa trên status mà staff nhập
        if (inspectionStatus == BatteryInspection.InspectionStatus.IN_MAINTENANCE) {
            // Pin cần bảo trì -> chuyển sang MAINTENANCE
            battery.setBatteryStatus(Battery.BatteryStatus.MAINTENANCE);
        } else if (inspectionStatus == BatteryInspection.InspectionStatus.PASS) {
            // Pin vượt qua kiểm tra -> chuyển về AVAILABLE (sẵn sàng sử dụng)
            battery.setBatteryStatus(Battery.BatteryStatus.CHARGING);
        }

//        // Tăng số lượng chu kỳ sử dụng
//        if (battery.getCycleCount() == null) {
//            battery.setCycleCount(1);
//        } else {
//            battery.setCycleCount(battery.getCycleCount() + 1);
//        }

        // Lưu thay đổi vào database
        batteryRepository.save(battery);

        log.info("Đã cập nhật thông tin pin {} sau kiểm tra: Status={}, StateOfHealth={}, CycleCount={}",
                battery.getBatteryId(), battery.getBatteryStatus(), battery.getStateOfHealth(), battery.getCycleCount());

        // Gửi cập nhật realtime qua WebSocket
        sendRealtimeUpdate(battery, "STATUS_CHANGED");

    }

    // -----------------------------------------
    // --- HÀM CẬP NHẬT PIN KHI SỬA INSPECTION ---
    // -----------------------------------------
    private void updateBatteryFromInspectionUpdate(Battery battery, BatteryInspection inspection) {

        // Cập nhật trạng thái pin dựa trên status mà staff đã đánh giá
        if (inspection.getStatus() == BatteryInspection.InspectionStatus.IN_MAINTENANCE) {
            // Pin cần bảo trì -> chuyển sang MAINTENANCE
            battery.setBatteryStatus(Battery.BatteryStatus.MAINTENANCE);
        } else if (inspection.getStatus() == BatteryInspection.InspectionStatus.PASS) {
            // Pin vượt qua kiểm tra -> chuyển về AVAILABLE (sẵn sàng sử dụng)
            battery.setBatteryStatus(Battery.BatteryStatus.AVAILABLE);
        }

        // Lưu thay đổi vào database
        batteryRepository.save(battery);

        log.info("Đã cập nhật lại thông tin pin {} sau chỉnh sửa inspection: Status={}, StateOfHealth={}",
                battery.getBatteryId(), battery.getBatteryStatus(), battery.getStateOfHealth());

        sendRealtimeUpdate(battery, "STATUS_CHANGED");

    }

    private void sendRealtimeUpdate(Battery battery, String action) {
        try {
            DockSlot slot = battery.getDockSlot();
            if (slot == null) return; // pin không nằm ở dock thì khỏi push realtime

            BatteryRealtimeEvent event = BatteryRealtimeEvent.builder()
                    .stationId(slot.getDock().getStation().getStationId())
                    .dockId(slot.getDockSlotId())
                    .dockName(slot.getDock().getDockName())
                    .slotNumber(slot.getSlotNumber())
                    .batteryId(battery.getBatteryId())
                    .batteryStatus(battery.getBatteryStatus().name())
                    .batteryType(battery != null ? battery.getBatteryType().name() : null)
                    .stateOfHealth(battery.getStateOfHealth())
                    .currentCapacity(battery.getCurrentCapacity())
                    .cycleCount(battery != null ? battery.getCycleCount() : null)
                    .action(action) // e.g. "INSPECTED" / "STATUS_CHANGED"
                    .timestamp(LocalDateTime.now().toString())
                    .build();

            String json = objectMapper.writeValueAsString(event);
            batterySocketController.broadcastToStation(event.getStationId(), json);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

}