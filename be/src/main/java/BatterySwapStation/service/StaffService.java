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
import java.util.List;
import java.util.Map;
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

    @Transactional(readOnly = true)
    public List<StaffListItemDTO> getAllStaffFlat() {
        // 🔹 Lấy toàn bộ staff kèm thông tin station (nếu có)
        return userRepository.findAllStaffWithStation();
    }

    @Transactional(readOnly = true)
    public List<StationStaffGroupDTO> getAllStaffGroupedByStation() {
        // 1️⃣ Lấy toàn bộ staff cùng station
        List<StaffListItemDTO> allStaff = userRepository.findAllStaffWithStation();

        // 2️⃣ Group theo stationId (xử lý null => dùng -1 để tránh NPE)
        Map<Integer, List<StaffListItemDTO>> grouped = allStaff.stream()
                .collect(Collectors.groupingBy(staff ->
                        staff.getStationId() != null ? staff.getStationId() : -1
                ));

        // 3️⃣ Duyệt từng group và tạo StationStaffGroupDTO
        return grouped.entrySet().stream()
                .map(entry -> {
                    Integer stationId = entry.getKey();
                    List<StaffListItemDTO> staffList = entry.getValue();

                    // ✅ Nếu là nhóm chưa assign
                    if (stationId == -1) {
                        return new StationStaffGroupDTO(
                                null,
                                "Unassigned",
                                null,
                                false,
                                staffList
                        );
                    }

                    // ✅ Nếu có trạm thì lấy thông tin trạm từ DB
                    Station station = stationRepository.findById(stationId).orElse(null);

                    return new StationStaffGroupDTO(
                            station != null ? station.getStationId() : null,
                            station != null ? station.getStationName() : "Unknown Station",
                            station != null ? station.getAddress() : null,
                            station != null && station.isActive(),
                            staffList
                    );
                })
                // ✅ Sắp xếp cho nhóm “Unassigned” nằm đầu
                .sorted((a, b) -> a.getStationId() == null ? -1 : 1)
                .collect(Collectors.toList());
    }



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

            if (!staff.isActive()) {
                staff.setActive(true);
                userRepository.save(staff);
            }

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



    @Transactional
    public void unassignStaff(String staffId) {
        // 🔹 Lấy assign đang active
        StaffAssign currentAssign = staffAssignRepository.findFirstByUser_UserIdAndIsActiveTrue(staffId);
        if (currentAssign == null) {
            throw new RuntimeException("Staff không có assign hoạt động để hủy.");
        }

        // 🔹 Deactivate assign
        currentAssign.setActive(false);
        staffAssignRepository.save(currentAssign);

        // 🔹 Cập nhật user.active = false
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy staff: " + staffId));
        staff.setActive(false);
        userRepository.save(staff);
    }

    @Transactional(readOnly = true)
    public List<StaffListItemDTO> getStaffByStation(Integer stationId) {
        return userRepository.findStaffByStationId(stationId);
    }

}
