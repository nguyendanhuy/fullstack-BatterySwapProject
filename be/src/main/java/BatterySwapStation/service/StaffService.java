package BatterySwapStation.service;

import BatterySwapStation.dto.CreateStaffRequest;
import BatterySwapStation.dto.CreateStaffResponse;
import BatterySwapStation.dto.StaffListItemDTO;
import BatterySwapStation.dto.UpdateStaffAssignRequest;
import BatterySwapStation.entity.*;
import BatterySwapStation.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StaffService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final StationRepository stationRepository;
    private final StaffAssignRepository staffAssignRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public CreateStaffResponse createStaff(CreateStaffRequest req) {
        // 1️⃣ Kiểm tra trùng email
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email đã tồn tại: " + req.getEmail());
        }

        // 2️⃣ Sinh staffId tự động
        long staffCount = userRepository.countByRole_RoleId(2); // roleId=2 là STAFF
        String staffId = String.format("ST%03d", staffCount + 1);

        // 3️⃣ Lấy role STAFF
        Role staffRole = roleRepository.findByRoleName("STAFF");
        if (staffRole == null) throw new RuntimeException("Không thấy role STAFF");

        // 4️⃣ Mã hóa mật khẩu
        String encodedPassword = passwordEncoder.encode(req.getPassword());

        // 5️⃣ Tạo staff (chưa assign → inactive)
        User staff = new User();
        staff.setUserId(staffId);
        staff.setFullName(req.getName());
        staff.setEmail(req.getEmail());
        staff.setPassword(encodedPassword);
        staff.setActive(false); // ⛔ Mặc định chưa assign thì inactive
        staff.setVerified(true);
        staff.setRole(staffRole);

        userRepository.save(staff);

        // 6️⃣ Gán trạm nếu có (tự động active staff & assign)
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

            // ✅ Khi assign → tự động bật staff active
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
    public List<StaffListItemDTO> getAllStaff() {
        // 🔹 Lấy trực tiếp từ repository (1 query duy nhất)
        return userRepository.findAllStaffWithStation();
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
