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

        // 2️⃣ Sinh staffId tự động: ST001, ST002, ...
        long staffCount = userRepository.countByRole_RoleId(2); // Giả sử roleId=2 là STAFF
        String staffId = String.format("ST%03d", staffCount + 1);

        // 3️⃣ Lấy role STAFF
        Role staffRole = roleRepository.findByRoleName("STAFF");
        if (staffRole == null) throw new RuntimeException("Không thấy role STAFF");


        // 4️⃣ Mã hóa mật khẩu
        String encodedPassword = passwordEncoder.encode(req.getPassword());

        // 5️⃣ Tạo user entity
        User staff = new User();
        staff.setUserId(staffId);
        staff.setFullName(req.getName());
        staff.setEmail(req.getEmail());
        staff.setPassword(encodedPassword);
        staff.setActive(true);
        staff.setVerified(true);
        staff.setRole(staffRole);

        userRepository.save(staff);

        // 6️⃣ Gán staff vào station
        Station station = stationRepository.findById(req.getStationId())
                .orElseThrow(() -> new RuntimeException("Station not found: " + req.getStationId()));

        StaffAssign assign = new StaffAssign();
        assign.setUser(staff);
        assign.setStationId(station.getStationId());
        assign.setAssignDate(LocalDateTime.now());
        staffAssignRepository.save(assign);

        return new CreateStaffResponse(
                staff.getUserId(),
                staff.getFullName(),
                staff.getEmail(),
                staff.getRole().getRoleName(),
                station.getStationId(),
                station.getStationName(),
                staff.isActive()
        );
    }


    @Transactional(readOnly = true)
    public List<StaffListItemDTO> getAllStaff() {
        // 1️⃣ Lấy tất cả user có roleId = 2 (STAFF)
        List<User> staffUsers = userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && u.getRole().getRoleId() == 2)
                .collect(Collectors.toList());

        // 2️⃣ Map sang DTO, gắn thông tin assign (nếu có)
        return staffUsers.stream().map(user -> {
            StaffAssign assign = staffAssignRepository.findFirstByUser_UserIdAndIsActiveTrue(user.getUserId());
            Station station = null;
            Integer stationId = null;
            String stationName = null;

            if (assign != null) {
                stationId = assign.getStationId();
                station = stationRepository.findById(stationId).orElse(null);
                if (station != null) {
                    stationName = station.getStationName();
                }
            }

            return new StaffListItemDTO(
                    user.getUserId(),
                    user.getFullName(),
                    user.getEmail(),
                    stationId,
                    stationName,
                    user.isActive()
            );
        }).collect(Collectors.toList());
    }

    @Transactional
    public StaffListItemDTO updateStaffAssign(String staffId, UpdateStaffAssignRequest req) {
        // 1️⃣ Lấy user
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy staff: " + staffId));

        // 2️⃣ Cập nhật trạng thái Active (nếu có)
        if (req.getActive() != null) {
            staff.setActive(req.getActive());
            userRepository.save(staff);
        }

        // 3️⃣ Tìm bản ghi assign hiện tại (nếu có)
        StaffAssign currentAssign = staffAssignRepository.findFirstByUser_UserIdAndIsActiveTrue(staffId);

        // 4️⃣ Nếu có stationId mới
        if (req.getStationId() != null) {
            // Nếu staff chưa có assign, tạo mới
            if (currentAssign == null) {
                currentAssign = new StaffAssign();
                currentAssign.setUser(staff);
            }

            // Gán trạm mới
            currentAssign.setStationId(req.getStationId());
            currentAssign.setActive(true);
            staffAssignRepository.save(currentAssign);
        }

        // 5️⃣ Trả về DTO kết quả
        Station station = null;
        if (req.getStationId() != null) {
            station = stationRepository.findById(req.getStationId()).orElse(null);
        } else if (currentAssign != null) {
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
        StaffAssign assign = staffAssignRepository.findFirstByUser_UserIdAndIsActiveTrue(staffId);
        if (assign == null) {
            throw new RuntimeException("Staff không có assign hoạt động.");
        }

        assign.setActive(false);
        staffAssignRepository.save(assign);
    }
}
