package BatterySwapStation.service;

import BatterySwapStation.dto.*;
import BatterySwapStation.entity.*;
import BatterySwapStation.repository.*;

import BatterySwapStation.utils.UserIdGenerator;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StaffService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final StationRepository stationRepository;
    private final StaffAssignRepository staffAssignRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserIdGenerator userIdGenerator;

    // ===========================================================
    // ✅ CREATE STAFF
    // ===========================================================
    @Transactional
    public CreateStaffResponse createStaff(CreateStaffRequest req) {
        // 1️⃣ Kiểm tra trùng email
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email đã tồn tại: " + req.getEmail());
        }

        // 2️⃣ Lấy role STAFF
        Role staffRole = roleRepository.findByRoleName("STAFF");
        if (staffRole == null) throw new RuntimeException("Không thấy role STAFF");

        // ✅ 3️⃣ Sinh staffId bằng UserIdGenerator (an toàn, không trùng)
        String staffId = userIdGenerator.generateUserId(staffRole);

        // 4️⃣ Mã hóa mật khẩu
        String encodedPassword = passwordEncoder.encode(req.getPassword());

        // 5️⃣ Tạo staff (chưa assign → inactive)
        User staff = new User();
        staff.setUserId(staffId);
        staff.setFullName(req.getName());
        staff.setEmail(req.getEmail());
        staff.setPassword(encodedPassword);
        staff.setActive(false);
        staff.setVerified(true);
        staff.setRole(staffRole);

        userRepository.save(staff);

        // 6️⃣ Gán trạm nếu có
        Station station = null;
        if (req.getStationId() != null) {
            station = stationRepository.findById(req.getStationId())
                    .orElseThrow(() -> new RuntimeException("Station not found: " + req.getStationId()));

            StaffAssign assign = new StaffAssign();
            assign.setUser(staff);
            assign.setStationId(station.getStationId());
            assign.setAssignDate(LocalDateTime.now());
            assign.setActive(true);
            staffAssignRepository.save(assign);

            // ✅ Đồng bộ trạng thái User
            staff.setActive(true);
            userRepository.save(staff);
        }

        return new CreateStaffResponse(
                staff.getUserId(),
                staff.getFullName(),
                staff.getEmail(),
                staff.getRole().getRoleName(),
                station != null ? station.getStationId() : null,
                station != null ? station.getStationName() : null,
                staff.isActive()
        );
    }

    // ===========================================================
    // ✅ LẤY DANH SÁCH STAFF (FLAT)
    // ===========================================================
    @Transactional(readOnly = true)
    public List<StaffListItemDTO> getAllStaffFlat() {
        // ✅ Lấy toàn bộ staff với station & trạng thái từ assign mới nhất
        List<StaffListItemDTO> list = userRepository.findAllStaffWithStation();

        // 🔹 Đồng bộ trạng thái từ assign mới nhất về user.isActive
        syncUserActiveFromAssign(list);

        return list;
    }

    // ===========================================================
    // ✅ LẤY DANH SÁCH NHÓM THEO TRẠM
    // ===========================================================
    @Transactional(readOnly = true)
    public List<StationStaffGroupDTO> getAllStaffGroupedByStation() {
        // 1️⃣ Lấy toàn bộ staff cùng station (có thể có staff chưa có stationId)
        List<StaffListItemDTO> allStaff = userRepository.findAllStaffWithStation();

        // 🔹 Đồng bộ trạng thái trước khi group
        syncUserActiveFromAssign(allStaff);

        // 2️⃣ Lấy toàn bộ station trong hệ thống
        List<Station> allStations = stationRepository.findAll();

        // 3️⃣ Group staff theo stationId
        Map<Integer, List<StaffListItemDTO>> grouped = allStaff.stream()
                .filter(staff -> staff.getStationId() != null)
                .collect(Collectors.groupingBy(StaffListItemDTO::getStationId));

        // 4️⃣ Trả về DTO gộp
        return allStations.stream()
                .map(station -> new StationStaffGroupDTO(
                        station.getStationId(),
                        station.getStationName(),
                        station.getAddress(),
                        station.isActive(),
                        grouped.getOrDefault(station.getStationId(), Collections.emptyList())
                ))
                .sorted(Comparator.comparing(StationStaffGroupDTO::getStationId))
                .collect(Collectors.toList());
    }

    // ===========================================================
    // ✅ CẬP NHẬT GÁN STAFF → STATION
    // ===========================================================
    @Transactional
    public StaffListItemDTO updateStaffAssign(String staffId, UpdateStaffAssignRequest req) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy staff: " + staffId));

        // 🔹 Lấy assign hiện tại (nếu có)
        StaffAssign currentAssign = staffAssignRepository.findFirstByUser_UserIdAndIsActiveTrue(staffId);

        // 🔹 Nếu có stationId mới => deactivate assign cũ và tạo assign mới
        if (req.getStationId() != null) {
            if (currentAssign != null) {
                currentAssign.setActive(false);
                staffAssignRepository.save(currentAssign);
            }

            // ✅ Tạo assign mới
            StaffAssign newAssign = new StaffAssign();
            newAssign.setUser(staff);
            newAssign.setStationId(req.getStationId());
            newAssign.setAssignDate(LocalDateTime.now());
            newAssign.setActive(true);
            staffAssignRepository.save(newAssign);

            // ✅ Đồng bộ trạng thái user
            staff.setActive(true);
            userRepository.save(staff);

            currentAssign = newAssign;
        }

        // 🔹 Xác định station để trả về DTO
        Station station = null;
        if (currentAssign != null) {
            station = stationRepository.findById(currentAssign.getStationId()).orElse(null);
        }

        return new StaffListItemDTO(
                staff.getUserId(),
                staff.getFullName(),
                staff.getEmail(),
                (station != null ? station.getStationId() : null),
                (station != null ? station.getStationName() : null),
                staff.isActive()
        );
    }

    // ===========================================================
    // ✅ HỦY GÁN STAFF
    // ===========================================================
    @Transactional
    public void unassignStaff(String staffId) {
        StaffAssign currentAssign = staffAssignRepository.findFirstByUser_UserIdAndIsActiveTrue(staffId);
        if (currentAssign == null) {
            throw new RuntimeException("Staff không có assign hoạt động để hủy.");
        }

        currentAssign.setActive(false);
        staffAssignRepository.save(currentAssign);

        // ✅ Đồng bộ user.active = false
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy staff: " + staffId));
        staff.setActive(false);
        userRepository.save(staff);
    }

    // ===========================================================
    // ✅ LẤY STAFF THEO TRẠM
    // ===========================================================
    @Transactional(readOnly = true)
    public List<StaffListItemDTO> getStaffByStation(Integer stationId) {
        List<StaffListItemDTO> list = userRepository.findStaffByStationId(stationId);
        syncUserActiveFromAssign(list);
        return list;
    }

    // ===========================================================
    // ✅ HÀM PHỤ ĐỒNG BỘ USER.ACTIVE TỪ ASSIGN
    // ===========================================================
    private void syncUserActiveFromAssign(List<StaffListItemDTO> staffList) {
        for (StaffListItemDTO s : staffList) {
            StaffAssign latest = staffAssignRepository.findFirstByUser_UserIdAndIsActiveTrue(s.getStaffId());
            s.setActive(latest != null && latest.isActive());
        }
    }
}
