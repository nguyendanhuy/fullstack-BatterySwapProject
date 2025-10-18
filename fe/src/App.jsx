import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import VerifyEmail from "./pages/VerifyEmail";
import { DriverLayout } from "@/components/DriverLayout";
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
import { StaffLayout } from "./components/StaffLayout";
const queryClient = new QueryClient();
<<<<<<< HEAD
const App = () => (
  <QueryClientProvider client={queryClient}>
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
              <Route path="/verify-email" element={<VerifyEmail />} />
              {/* Driver (bảo vệ cả nhánh) */}
              <Route
                path="/driver"
                element={
                  <DriverPrivateRoute>
                    <DriverLayout />
                  </DriverPrivateRoute>
                }
              >
                <Route index element={<DriverDashboard />} />
                <Route path="register-vehicle" element={<VehicleRegistration />} />
                <Route path="find-stations" element={<StationFinder />} />
                <Route path="reservation" element={<Reservation />} />
                <Route path="payment" element={<Payment />} />
                <Route path="subscriptions" element={<Subscriptions />} />
                <Route path="booking-history" element={<BookingHistory />} />
              </Route>
              {/* Staff routes */}
              <Route path="/staff" element={<StaffPrivateRoute><StaffDashboard /></StaffPrivateRoute>} />
              <Route path="/staff/qr-checkin" element={<StaffPrivateRoute><QRCheckIn /></StaffPrivateRoute>} />
              <Route path="/staff/transaction-history" element={<StaffPrivateRoute><TransactionHistory /></StaffPrivateRoute>} />
              <Route path="/staff/battery-inventory" element={<StaffPrivateRoute><BatteryInventory /></StaffPrivateRoute>} />
              <Route path="/staff/battery-inspection" element={<StaffPrivateRoute><BatteryInspection /></StaffPrivateRoute>} />
=======
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
            <Route path="/verify-email" element={<VerifyEmail />} />
            {/* Driver (bảo vệ cả nhánh) */}
            <Route
              path="/driver"
              element={
                <DriverPrivateRoute>
                  <DriverLayout />
                </DriverPrivateRoute>
              }
            >
              <Route index element={<DriverDashboard />} />
              <Route path="register-vehicle" element={<VehicleRegistration />} />
              <Route path="find-stations" element={<StationFinder />} />
              <Route path="reservation" element={<Reservation />} />
              <Route path="payment" element={<Payment />} />
              <Route path="subscriptions" element={<Subscriptions />} />
              <Route path="booking-history" element={<BookingHistory />} />
            </Route>

            {/* Staff routes */}
            <Route
              path="/staff"
              element={
                <StaffPrivateRoute>
                  <StaffLayout />
                </StaffPrivateRoute>
              }
            >
              <Route index element={<StaffDashboard />} />
              <Route path="qr-checkin" element={<QRCheckIn />} />
              <Route path="transaction-history" element={<TransactionHistory />} />
              <Route path="battery-inventory" element={<BatteryInventory />} />
              <Route path="battery-inspection" element={<BatteryInspection />} />
            </Route>
>>>>>>> 476f6b6be4a92f5c50bbc87f31ec787ec4bb6321

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
