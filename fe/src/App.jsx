import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
// Driver pages
import DriverDashboard from "./pages/driver/Dashboard";
import VehicleRegistration from "./pages/driver/VehicleRegistration";
import StationFinder from "./pages/driver/StationFinder";
import Reservation from "./pages/driver/Reservation";
import Payment from "./pages/driver/Payment";
import Subscriptions from "./pages/driver/Subscriptions";
import BookingHistory from "./pages/driver/BookingHistory";
// Staff pages
import StaffDashboard from "./pages/staff/Dashboard";
import QRCheckIn from "./pages/staff/QRCheckIn";
import TransactionHistory from "./pages/staff/TransactionHistory";
import BatteryInventory from "./pages/staff/BatteryInventory";
import BatteryInspection from "./pages/staff/BatteryInspection";
// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import Reports from "./pages/admin/Reports";
import BatteryDispatch from "./pages/admin/BatteryDispatch";
import StaffManagement from "./pages/admin/StaffManagement";
import { SystemProvider } from "./contexts/system.context";
import DriverPrivateRoute from "./pages/DriverPrivateRouter";
import StaffPrivateRoute from "./pages/StaffPrivateRouter";
import AdminPrivateRoute from "./pages/AdminPrivateRouter";
import AuthProvider from "./components/AuthProvider";
const queryClient = new QueryClient();
const App = () => (<QueryClientProvider client={queryClient}>
  <SystemProvider>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            {/* Driver routes */}
            <Route path="/driver" element={<DriverPrivateRoute><DriverDashboard /></DriverPrivateRoute>} />
            <Route path="/driver/register-vehicle" element={<DriverPrivateRoute><VehicleRegistration /></DriverPrivateRoute>} />
            <Route path="/driver/find-stations" element={<DriverPrivateRoute><StationFinder /></DriverPrivateRoute>} />
            <Route path="/driver/reservation" element={<DriverPrivateRoute><Reservation /></DriverPrivateRoute>} />
            <Route path="/driver/payment" element={<DriverPrivateRoute><Payment /></DriverPrivateRoute>} />
            <Route path="/driver/subscriptions" element={<DriverPrivateRoute><Subscriptions /></DriverPrivateRoute>} />
            <Route path="/driver/booking-history" element={<DriverPrivateRoute><BookingHistory /></DriverPrivateRoute>} />

            {/* Staff routes */}
            <Route path="/staff" element={<StaffPrivateRoute><StaffDashboard /></StaffPrivateRoute>} />
            <Route path="/staff/qr-checkin" element={<StaffPrivateRoute><QRCheckIn /></StaffPrivateRoute>} />
            <Route path="/staff/transaction-history" element={<StaffPrivateRoute><TransactionHistory /></StaffPrivateRoute>} />
            <Route path="/staff/battery-inventory" element={<StaffPrivateRoute><BatteryInventory /></StaffPrivateRoute>} />
            <Route path="/staff/battery-inspection" element={<StaffPrivateRoute><BatteryInspection /></StaffPrivateRoute>} />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminPrivateRoute><AdminDashboard /></AdminPrivateRoute>} />
            <Route path="/admin/reports" element={<AdminPrivateRoute><Reports /></AdminPrivateRoute>} />
            <Route path="/admin/battery-dispatch" element={<AdminPrivateRoute><BatteryDispatch /></AdminPrivateRoute>} />
            <Route path="/admin/staff-management" element={<AdminPrivateRoute><StaffManagement /></AdminPrivateRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </SystemProvider>
</QueryClientProvider>);

export default App;
