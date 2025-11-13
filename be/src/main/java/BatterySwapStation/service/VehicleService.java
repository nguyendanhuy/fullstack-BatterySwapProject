package BatterySwapStation.service;

import BatterySwapStation.dto.VehicleMyResponse;
import BatterySwapStation.dto.VehicleRegistrationRequest;
import BatterySwapStation.dto.VehicleInfoResponse;
import BatterySwapStation.dto.VehicleSimpleResponse;
import BatterySwapStation.entity.Battery;
import BatterySwapStation.entity.User;
import BatterySwapStation.entity.Vehicle;
import BatterySwapStation.repository.BatteryRepository;
import BatterySwapStation.repository.UserRepository;
import BatterySwapStation.repository.VehicleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final BatteryRepository batteryRepository;


    private boolean validateVIN(String vin) {
        return vin != null && vin.length() == 17 && vin.matches("^[A-HJ-NPR-Z0-9]{17}$");
    }

    @Transactional(readOnly = true)
    public Vehicle getVehicleInfoByVin(String vin) {
        if (!validateVIN(vin)) {
            throw new IllegalArgumentException("Định dạng VIN không hợp lệ.");
        }
        return vehicleRepository.findByVIN(vin)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy xe với mã VIN: " + vin));
    }

    @Transactional(readOnly = true)
    public VehicleInfoResponse getVehicleInfoResponseByVin(String vin) {
        Vehicle vehicle = vehicleRepository.findByVIN(vin)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy xe với mã VIN: " + vin));

        VehicleInfoResponse response = new VehicleInfoResponse();

        response.setVin(vehicle.getVIN());
        response.setOwnerName(vehicle.getOwnerName());
        response.setUserId(vehicle.getUser() != null ? vehicle.getUser().getUserId() : null);
        response.setVehicleType(vehicle.getVehicleType() != null ? vehicle.getVehicleType().toString() : null);
        response.setBatteryType(vehicle.getBatteryType() != null ? vehicle.getBatteryType().toString() : null);
        response.setBatteryCount(vehicle.getBatteryCount());
        response.setPurchaseDate(vehicle.getPurchaseDate());
        response.setManufactureYear(vehicle.getManufactureDate() != null ? vehicle.getManufactureDate().getYear() : 0);
        response.setColor(vehicle.getColor());
        response.setLicensePlate(vehicle.getLicensePlate());
        response.setVehicleId(vehicle.getVehicleId());
        response.setActive(vehicle.isActive());

        // 🔥 NEW: Lấy danh sách pin → convert sang chuỗi
        List<String> batteryIds = batteryRepository.findByVehicle(vehicle)
                .stream()
                .map(Battery::getBatteryId)
                .toList();

        String batteryIdsString = String.join(", ", batteryIds);
        response.setBatteryIds(batteryIdsString);

        return response;
    }



    @Transactional
    public Vehicle assignVehicleToUser(String userId, String vin) {
        if (!validateVIN(vin)) {
            throw new IllegalArgumentException("Định dạng VIN không hợp lệ.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng với mã: " + userId));
        Vehicle vehicle = getVehicleInfoByVin(vin);

        if (vehicle.getUser() != null || vehicle.isActive()) {
            throw new IllegalStateException("Xe với mã VIN " + vin + " đã được gán cho người dùng khác.");
        }

        vehicle.setUser(user);
        vehicle.setActive(true);
        return vehicleRepository.save(vehicle);
    }

    @Transactional
    public Vehicle registerNewVehicle(String userId, VehicleRegistrationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng với mã: " + userId));

        if (vehicleRepository.findByVIN(request.getVin()).isPresent()) {
            throw new IllegalStateException("Xe với mã VIN " + request.getVin() + " đã tồn tại.");
        }

        Vehicle newVehicle = new Vehicle();
        newVehicle.setUser(user);
        newVehicle.setVIN(request.getVin());
        newVehicle.setVehicleType(request.getVehicleType());
        newVehicle.setBatteryType(request.getBatteryType());
        newVehicle.setActive(true);

        // Tự động thiết lập số lượng pin dựa trên loại xe
        int batteryCount = calculateBatteryCountByVehicleType(request.getVehicleType());
        newVehicle.setBatteryCount(batteryCount);

        return vehicleRepository.save(newVehicle);
    }

    // Helper method để tính số lượng pin theo loại xe
    private int calculateBatteryCountByVehicleType(Vehicle.VehicleType vehicleType) {
        if (vehicleType == null) {
            return 1; // Mặc định 1 pin
        }

        switch (vehicleType) {
            case THEON:
            case FELIZ:
            case VENTO:
                return 1; // Xe máy điện nhỏ thường có 1 pin

            case KLARA_S:
            case KLARA_A2:
            case TEMPEST:
                return 2; // Xe máy điện cao cấp có 2 pin

            case VF_5:
            case VF_6:
                return 1; // Xe ô tô điện nhỏ có 1 bộ pin

            case VF_7:
            case VF_8:
            case VF_9:
                return 1; // Xe ô tô điện lớn có 1 bộ pin (nhưng dung lượng cao hơn)

            default:
                return 1;
        }
    }

    @Transactional(readOnly = true)
    public List<Vehicle> getActiveUserVehicles(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng với mã: " + userId));

        // Tạm thời hardcode userId = "DR006" để test
        //User user = userRepository.findById("DR006")
          //      .orElseThrow(() -> new EntityNotFoundException("User not found with ID: DR006"));

        // Sử dụng query với JOIN FETCH để lấy luôn thông tin User (owner)
        return vehicleRepository.findByUserAndIsActiveTrueWithOwner(user);
    }

    @Transactional
    public void deactivateVehicle(int vehicleId, String userId) {
        Vehicle vehicle = vehicleRepository.findByVehicleIdAndUser_UserId(vehicleId, userId)
                .orElseThrow(() -> new EntityNotFoundException("Xe không tồn tại hoặc không thuộc về người dùng."));

        vehicle.setActive(false);
        vehicle.setUser(null);
        vehicleRepository.save(vehicle);
    }

    public List<VehicleSimpleResponse> getUnassignedVehiclesSimple() {
        List<Vehicle> vehicles = vehicleRepository.findUnassignedVehicles();

        return vehicles.stream().map(v -> {
            VehicleSimpleResponse dto = new VehicleSimpleResponse();
            dto.setVehicleId(v.getVehicleId());
            dto.setVIN(v.getVIN());
            dto.setVehicleType(v.getVehicleType() != null ? v.getVehicleType().toString() : null);
            dto.setBatteryType(v.getBatteryType() != null ? v.getBatteryType().toString() : null);
            dto.setBatteryCount(v.getBatteryCount());
            dto.setOwnerName(v.getOwnerName());
            dto.setColor(v.getColor());
            dto.setLicensePlate(v.getLicensePlate());
            dto.setActive(v.isActive());
            return dto;
        }).toList();
    }


    public List<VehicleMyResponse> getMyVehiclesResponse(String userId) {
        List<Vehicle> vehicles = getActiveUserVehicles(userId);

        return vehicles.stream().map(v -> {
            VehicleMyResponse dto = new VehicleMyResponse();
            dto.setVehicleId(v.getVehicleId());
            dto.setVehicleType(v.getVehicleType() != null ? v.getVehicleType().toString() : null);
            dto.setBatteryType(v.getBatteryType() != null ? v.getBatteryType().toString() : null);
            dto.setManufactureDate(v.getManufactureDate() != null ? v.getManufactureDate().toString() : null);
            dto.setPurchaseDate(v.getPurchaseDate() != null ? v.getPurchaseDate().toString() : null);
            dto.setLicensePlate(v.getLicensePlate());
            dto.setColor(v.getColor());
            dto.setBatteryCount(v.getBatteryCount());
            dto.setOwnerName(v.getOwnerName());
            dto.setActive(v.isActive());
            dto.setVin(v.getVIN());

            List<String> batteryIds = batteryRepository.findByVehicle(v)
                    .stream()
                    .map(Battery::getBatteryId)
                    .toList();

            String batteryIdsString = String.join(", ", batteryIds);
            dto.setBatteryIds(batteryIdsString);

            return dto;
        }).toList();
    }




    @Transactional(readOnly = true)
    public int countVehiclesByUserId(String userId) {
        return vehicleRepository.countByUserId(userId);
    }
}

