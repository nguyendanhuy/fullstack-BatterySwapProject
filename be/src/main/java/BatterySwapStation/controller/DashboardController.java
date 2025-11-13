package BatterySwapStation.controller;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import BatterySwapStation.service.VehicleService;
import BatterySwapStation.service.StationService;
import BatterySwapStation.service.BookingService;
import BatterySwapStation.service.SubscriptionService;

@RestController
public class DashboardController {

    @Autowired
    private VehicleService vehicleService;

    @Autowired
    private StationService stationService;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private SubscriptionService subscriptionService;

    @GetMapping("/dashboard")
    public DashboardResponse getDashboardData(@RequestParam("userId") String userId) {
        int totalVehicle = vehicleService.countVehiclesByUserId(userId);
        int totalStation = stationService.countStations();
        int totalPendingSwappingBooking = bookingService.countPendingSwappingBookingsForUser(userId);
        int totalSubscription = subscriptionService.countAvailableSubscriptionPlans();

        return new DashboardResponse(totalVehicle, totalStation, totalPendingSwappingBooking, totalSubscription);
    }

    @Getter
    public static class DashboardResponse {
        private int totalVehicle;
        private int totalStation;
        private int totalPendingSwappingBooking;
        private int totalSubscription;

        public DashboardResponse(int totalVehicle, int totalStation, int totalPendingSwappingBooking, int totalSubscription) {
            this.totalVehicle = totalVehicle;
            this.totalStation = totalStation;
            this.totalPendingSwappingBooking = totalPendingSwappingBooking;
            this.totalSubscription = totalSubscription;
        }

    }
}
