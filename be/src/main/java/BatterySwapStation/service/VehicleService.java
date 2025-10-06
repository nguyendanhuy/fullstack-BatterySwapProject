package BatterySwapStation.service;

import BatterySwapStation.dto.VehicleRegistrationRequest;
import BatterySwapStation.dto.VehicleInfoResponse;
import BatterySwapStation.entity.User;
import BatterySwapStation.entity.Vehicle;
import BatterySwapStation.entity.VehiclePurchaseInvoice;
import BatterySwapStation.repository.UserRepository;
import BatterySwapStation.repository.VehicleRepository;
import BatterySwapStation.repository.VehiclePurchaseInvoiceRepository;
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
    private final VehiclePurchaseInvoiceRepository invoiceRepository;

    private boolean validateVIN(String vin) {
        return vin != null && vin.length() == 17 && vin.matches("^[A-HJ-NPR-Z0-9]{17}$");
    }

    @Transactional(readOnly = true)
    public Vehicle getVehicleInfoByVin(String vin) {
        if (!validateVIN(vin)) {
            throw new IllegalArgumentException("Invalid VIN format.");
        }
        return vehicleRepository.findByVIN(vin)
                .orElseThrow(() -> new EntityNotFoundException("Vehicle with VIN " + vin + " not found."));
    }

    @Transactional(readOnly = true)
    public VehicleInfoResponse getVehicleInfoResponseByVin(String vin) {
        Vehicle vehicle = getVehicleInfoByVin(vin);
        VehicleInfoResponse response = new VehicleInfoResponse();
        response.setVehicleId(vehicle.getVehicleId());
        response.setVehicleType(vehicle.getVehicleType().toString());
        response.setBatteryType(vehicle.getBatteryType().toString());
        response.setActive(vehicle.isActive());
        response.setVin(vehicle.getVIN());
        // Lấy phone từ bảng VehiclePurchaseInvoice theo vehicleId
        String phone = invoiceRepository.findByVehicle_VIN(vehicle.getVIN())
                .map(VehiclePurchaseInvoice::getBuyerPhone)
                .orElse(null);



        response.setPhone(phone);
        return response;
    }

    @Transactional
    public Vehicle assignVehicleToUser(String userId, String vin) {
        if (!validateVIN(vin)) {
            throw new IllegalArgumentException("Invalid VIN format.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + userId));
        Vehicle vehicle = getVehicleInfoByVin(vin);

        if (vehicle.getUser() != null || vehicle.isActive()) {
            throw new IllegalStateException("Vehicle with VIN " + vin + " is already assigned.");
        }

        vehicle.setUser(user);
        vehicle.setActive(true);
        return vehicleRepository.save(vehicle);
    }

    @Transactional
    public Vehicle registerNewVehicle(String userId, VehicleRegistrationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + userId));

        if (vehicleRepository.findByVIN(request.getVin()).isPresent()) {
            throw new IllegalStateException("Vehicle with VIN " + request.getVin() + " already exists.");
        }

        Vehicle newVehicle = new Vehicle();
        newVehicle.setUser(user);
        newVehicle.setVIN(request.getVin());
        newVehicle.setVehicleType(request.getVehicleType());
        newVehicle.setBatteryType(request.getBatteryType());
        newVehicle.setActive(true);

        return vehicleRepository.save(newVehicle);
    }

    @Transactional(readOnly = true)
    public List<Vehicle> getActiveUserVehicles(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + userId));
        return vehicleRepository.findByUserAndIsActiveTrue(user);
    }

    @Transactional
    public void deactivateVehicle(int vehicleId, String userId) {
        Vehicle vehicle = vehicleRepository.findByVehicleIdAndUser_UserId(vehicleId, userId)
                .orElseThrow(() -> new EntityNotFoundException("Vehicle not found or does not belong to the user."));

        vehicle.setActive(false);
        vehicle.setUser(null);
        vehicleRepository.save(vehicle);
    }
}