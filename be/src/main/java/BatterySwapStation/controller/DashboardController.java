package BatterySwapStation.controller;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import BatterySwapStation.service.VehicleService;
import BatterySwapStation.service.StationService;
import BatterySwapStation.service.BookingService;
import BatterySwapStation.service.SubscriptionService;
import BatterySwapStation.repository.UserRepository;
import BatterySwapStation.repository.SwapRepository;
import BatterySwapStation.repository.InvoiceRepository;

import java.time.LocalDate;

@RestController
@RequiredArgsConstructor
public class DashboardController {

    @Autowired
    private VehicleService vehicleService;

    @Autowired
    private StationService stationService;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private SubscriptionService subscriptionService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SwapRepository swapRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    /**
     * GET /api/dashboard
     * Hỗ trợ 3 chế độ:
     * - role=admin : trả các chỉ số hệ thống tổng quan (station count, subscription plan count, active users,...)
     * - role=staff : cần kèm stationId để trả chỉ số cho 1 trạm
     * - không truyền role (legacy) : yêu cầu userId và trả chỉ số scoped cho user đó
     */
    @GetMapping("/api/dashboard")
    public DashboardResponse getDashboardData(
            @RequestParam(value = "userId", required = false) String userId,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "stationId", required = false) Integer stationId
    ) {
        // Admin dashboard (hệ thống)
        if (role != null && role.equalsIgnoreCase("admin")) {
            int totalStation = stationService.countStations();
            int totalSubscription = subscriptionService.countAvailableSubscriptionPlans();
            // Đếm số người dùng hoạt động (role user = default role id assumed 2?)
            // Fallback: dùng tổng user nếu không có phân biệt role
            long activeUsers = userRepository.count();

            return new DashboardResponse(0, totalStation, 0, totalSubscription, activeUsers);
        }

        // Staff dashboard cho 1 trạm cụ thể
        if (role != null && role.equalsIgnoreCase("staff")) {
            if (stationId == null) {
                throw new IllegalArgumentException("stationId is required for staff role");
            }
            int totalStation = 1; // đang lấy 1 trạm
            int totalVehicle = 0;
            int totalPendingSwappingBooking = 0;
            int totalSubscription = subscriptionService.countAvailableSubscriptionPlans();

            // vehiclesAtStation: gọi method safe có tên countVehiclesAtStationSafe
            try {
                totalVehicle = stationService.countVehiclesAtStationSafe(stationId);
            } catch (Exception e) {
                // bất kỳ lỗi nào khi gọi method => log ra console và fallback 0
                System.err.println("Warning: failed to get vehiclesAtStationSafe: " + e.getMessage());
            }

            // Lấy count pending swapping bookings cho trạm (nếu có method), fallback 0
            try {
                var bookings = bookingService.getStationBookings(stationId);
                if (bookings != null) {
                    totalPendingSwappingBooking = (int) bookings.stream()
                            .filter(b -> "PENDINGSWAPPING".equalsIgnoreCase(b.getBookingStatus()))
                            .count();
                }
            } catch (Exception e) {
                System.err.println("Warning: failed to get pending swapping bookings for station: " + e.getMessage());
            }

            // Hiện controller chỉ trả các số đơn giản tương ứng UI: totalStation, totalVehicle, pending bookings, totalSubscription
            return new DashboardResponse(totalVehicle, totalStation, totalPendingSwappingBooking, totalSubscription, 0L);
        }

        // Legacy mode: user-scoped (như trước)
        if (role == null) {
            if (userId == null) {
                throw new IllegalArgumentException("userId is required when role is not provided");
            }

            int totalVehicle = vehicleService.countVehiclesByUserId(userId);
            int totalStation = stationService.countStations();
            int totalPendingSwappingBooking = bookingService.countPendingSwappingBookingsForUser(userId);
            int totalSubscription = subscriptionService.countAvailableSubscriptionPlans();

            return new DashboardResponse(totalVehicle, totalStation, totalPendingSwappingBooking, totalSubscription, 0L);
        }

        // If role provided but not admin/staff -> reject
        throw new IllegalArgumentException("Unsupported role: " + role);
    }

    // New admin dashboard endpoint
    @GetMapping("/api/dashboard/admin")
    public DashboardResponse getAdminDashboard(
            @RequestParam(value = "date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        LocalDate d = (date == null) ? LocalDate.now() : date;

        // 1) total stations
        int totalStation = stationService.countStations();

        // 2) total subscription plans available
        int totalSubscription = subscriptionService.countAvailableSubscriptionPlans();

        // 3) active users (count all users for now)
        long activeUsers = userRepository.count();

        // 4) swaps today (all stations)
        int swapsToday = swapRepository.fetchDailySwapByAllStations(d, d)
                .stream().mapToInt(r -> ((Number) r.get("swapCount")).intValue()).sum();

        // 5) revenue today (all stations)
        double revenueToday = invoiceRepository.fetchDailyRevenueByAllStations(d, d)
                .stream().mapToDouble(r -> ((Number) r.get("totalRevenue")).doubleValue()).sum();

        DashboardResponse resp = new DashboardResponse();
        resp.setTotalStation(totalStation);
        resp.setTotalSubscription(totalSubscription);
        resp.setActiveUsers(activeUsers);
        resp.setSwapsToday(swapsToday);
        resp.setRevenueToday(revenueToday);
        return resp;
    }

    // New staff dashboard endpoint (scoped to stationId)
    @GetMapping("/api/dashboard/staff")
    public DashboardResponse getStaffDashboard(
            @RequestParam(value = "stationId") Integer stationId,
            @RequestParam(value = "date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        if (stationId == null) throw new IllegalArgumentException("stationId is required");
        LocalDate d = (date == null) ? LocalDate.now() : date;

        // station basic
        int totalStation = 1;

        // vehicles at station (use safe helper)
        int vehiclesAtStation = 0;
        try {
            vehiclesAtStation = stationService.countVehiclesAtStationSafe(stationId);
        } catch (Exception e) {
            System.err.println("Warning: failed to get vehicles at station: " + e.getMessage());
        }

        // swaps today for this station
        int swapsToday = swapRepository.fetchDailySwapByStation(stationId, d, d)
                .stream().mapToInt(r -> ((Number) r.get("swapCount")).intValue()).sum();

        // revenue today for station
        double revenueToday = invoiceRepository.fetchDailyRevenueByStation(stationId, d, d)
                .stream().mapToDouble(r -> ((Number) r.get("totalRevenue")).doubleValue()).sum();

        DashboardResponse resp = new DashboardResponse();
        resp.setTotalStation(totalStation);
        resp.setTotalVehicle(vehiclesAtStation);
        resp.setSwapsToday(swapsToday);
        resp.setRevenueToday(revenueToday);
        return resp;
    }

    @Getter
    public static class DashboardResponse {
        private int totalVehicle;
        private int totalStation;
        private int totalPendingSwappingBooking;
        private int totalSubscription;
        private Long activeUsers; // optional (only for admin)

        // additional fields for admin/staff UI
        private int swapsToday;
        private double revenueToday;

        public DashboardResponse() {
        }

        // ...existing constructors kept for backward compatibility...
        public DashboardResponse(int totalVehicle, int totalStation, int totalPendingSwappingBooking, int totalSubscription) {
            this.totalVehicle = totalVehicle;
            this.totalStation = totalStation;
            this.totalPendingSwappingBooking = totalPendingSwappingBooking;
            this.totalSubscription = totalSubscription;
            this.activeUsers = null;
        }

        // Extended constructor for admin which needs activeUsers
        public DashboardResponse(int totalVehicle, int totalStation, int totalPendingSwappingBooking, int totalSubscription, Long activeUsers) {
            this.totalVehicle = totalVehicle;
            this.totalStation = totalStation;
            this.totalPendingSwappingBooking = totalPendingSwappingBooking;
            this.totalSubscription = totalSubscription;
            this.activeUsers = activeUsers;
        }

        // setters used by new endpoints
        public void setTotalVehicle(int totalVehicle) { this.totalVehicle = totalVehicle; }
        public void setTotalStation(int totalStation) { this.totalStation = totalStation; }
        public void setTotalPendingSwappingBooking(int totalPendingSwappingBooking) { this.totalPendingSwappingBooking = totalPendingSwappingBooking; }
        public void setTotalSubscription(int totalSubscription) { this.totalSubscription = totalSubscription; }
        public void setActiveUsers(Long activeUsers) { this.activeUsers = activeUsers; }
        public void setSwapsToday(int swapsToday) { this.swapsToday = swapsToday; }
        public void setRevenueToday(double revenueToday) { this.revenueToday = revenueToday; }

    }
}
