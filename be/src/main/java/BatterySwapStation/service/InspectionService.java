package BatterySwapStation.service;

import BatterySwapStation.dto.InspectionRequest;
import BatterySwapStation.dto.InspectionResponse;
import BatterySwapStation.dto.InspectionUpdateRequest;
import BatterySwapStation.entity.*;
import BatterySwapStation.repository.*;
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

        // 3. Xác định isDamaged dựa vào Status
        boolean isDamaged = inspectionStatus == BatteryInspection.InspectionStatus.IN_MAINTENANCE;

        // 4. Tạo và Lưu Inspection
        BatteryInspection inspection = BatteryInspection.builder()
                .booking(booking)
                .battery(battery)
                .staff(staff)
                .inspectionTime(LocalDateTime.now())
                .stateOfHealth(request.getStateOfHealth())
                .physicalNotes(request.getPhysicalNotes())
                .status(inspectionStatus)
                .isDamaged(isDamaged)
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

        if (request.getStateOfHealth() != null) {
            inspection.setStateOfHealth(request.getStateOfHealth());
        }
        if (request.getPhysicalNotes() != null) {
            inspection.setPhysicalNotes(request.getPhysicalNotes());
        }
        if (request.getDamaged() != null) {
            inspection.setDamaged(request.getDamaged());
        }
        if (request.getNewStatus() != null) {
            try {
                BatteryInspection.InspectionStatus newStatus =
                        BatteryInspection.InspectionStatus.valueOf(request.getNewStatus().toUpperCase());
                inspection.setStatus(newStatus);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Trạng thái Inspection không hợp lệ: " + request.getNewStatus() + ". Phải là PASS hoặc IN_MAINTENANCE.");
            }
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
        ins.setDamaged(inspection.isDamaged());

        if (inspection.getBattery() != null) {
            ins.setBatteryId(inspection.getBattery().getBatteryId());
        }

        if (inspection.getStatus() != null) {
            ins.setStatus(inspection.getStatus().name());
        }

        return ins;
    }
}