package BatterySwapStation.service;

import BatterySwapStation.dto.VehicleRegistrationRequest;
import BatterySwapStation.entity.User;
import BatterySwapStation.entity.Vehicle;
import BatterySwapStation.repository.UserRepository;
import BatterySwapStation.repository.VehicleRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class VehicleService {
    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    @Autowired
    public VehicleService(VehicleRepository vehicleRepository, UserRepository userRepository) {
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Vehicle registerVehicle(String userId, VehicleRegistrationRequest request) {
        // Validate user exists
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + userId));

        // Check if VIN is already registered
        if (vehicleRepository.findByVIN(request.getVin()).isPresent()) {
            throw new IllegalArgumentException("Vehicle with VIN " + request.getVin() + " is already registered");
        }

        // Create new vehicle
        Vehicle vehicle = new Vehicle();
        vehicle.setUser(user);
        vehicle.setVIN(request.getVin());
        vehicle.setVehicleType(request.getVehicleType());
        vehicle.setBatteryType(request.getBatteryType());
        vehicle.setActive(true);

        return vehicleRepository.save(vehicle);
    }

    public List<Vehicle> getUserVehicles(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with ID: " + userId));
        return vehicleRepository.findByUser(user);
    }

    public Vehicle getVehicleById(int vehicleId) {
        return vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new EntityNotFoundException("Vehicle not found with ID: " + vehicleId));
    }

    @Transactional
    public void deactivateVehicle(int vehicleId, String userId) {
        Vehicle vehicle = (Vehicle) vehicleRepository.findByVehicleIdAndUserUserId(vehicleId, userId)
                .orElseThrow(() -> new EntityNotFoundException("Vehicle not found or does not belong to user"));
        vehicle.setActive(false);
        vehicleRepository.save(vehicle);
    }

    public boolean validateVIN(String vin) {
        return vin != null &&
               vin.length() == 17 &&
               vin.matches("^[A-HJ-NPR-Z0-9]{17}$");
    }
}
