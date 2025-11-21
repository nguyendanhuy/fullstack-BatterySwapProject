import { data } from "autoprefixer";
import axios from "./axios.config";
import { act } from "react";

const registerAPI = (fullName, email, phone, address, password, confirmPassword) => {
    const data = {
        fullName: fullName,
        email: email,
        phone: phone,
        address: address,
        password: password,
        confirmPassword: confirmPassword,
    }
    return axios.post("/auth/register", data);
}

const loginAPI = (email, password) => {
    const data = {
        email: email,
        password: password
    };
    return axios.post("/auth/login", data);
}

const loginByGoogleAPI = (token) => {
    return axios.post("/auth/google", token);
}

const getInfoByToken = () => {
    return axios.get("/auth/me",);
}


const getVehicleInfoByVin = (vin) => {
    return axios.get(`/v1/vehicles/${vin}`);
}

const registerVehicleByVin = (vin) => {
    return axios.post(`/v1/vehicles/assign`, { vin });
}
const getUserAllVehicles = () => {
    return axios.get("/v1/vehicles/my-vehicles");
}
const deactivateVehicleByVin = (vin) => {
    return axios.post(`/v1/vehicles/${vin}/deactivate`);
}
const getAllStations = () => {
    return axios.get("/stations");
}
const getStationById = (stationId) => {
    return axios.get(`/stations/${stationId}`);
}
const getStationNearbyLocation = (lat, lng, radiusKm = 50) => {
    return axios.get(`/stations/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`);
}
const verifyEmailAPI = (token) => {
    return axios.get(`/auth/verify-email?token=${token}`);
}
const resendEmailAPIbyToken = (token) => {
    return axios.post(`/auth/resend-verification?token=${token}`);
}
const getBookingHistoryByUserId = (userId) => {
    return axios.get(`/bookings/user/${userId}`);
}
const getInvoiceById = (invoiceId) => {
    return axios.get(`/invoices/${invoiceId}`);
}
const cancelBookingById = (bookingId, userId, cancelReason) => {
    const data = {
        bookingId: bookingId,
        userId: userId,
        cancelReason: cancelReason
    }
    return axios.put(`/bookings/cancel`, data);
}


const getSwapDefaultPrice = () => {
    return axios.get("/system-price/BATTERY_SWAP");
}


const createBookingForVehicles = (data) => {
    return axios.post("/bookings/batch", data)
}

// const createInvoiceForBookings = (data) => {
//     return axios.post("/invoices/create-from-multiple-bookings", data)
// }

const createVNPayUrl = (data) => {
    return axios.post("/payments/vnpay/create", data)
}

const checkVNPayPaymentStatus = (txnRef) => {
    return axios.get(`/payments/vnpay/status/${txnRef}`);
}

const getInvoicebyUserId = (userId) => {
    return axios.get(`/invoices/user/${userId}`);
}

const cancelPendingInvoiceById = (invoiceId) => {
    return axios.post(`/invoices/${invoiceId}/cancel`);
}
const generateQRBooking = (bookingId) => {
    return axios.get(`/bookings/${bookingId}/generateQr`);
}
const verifyQrBooking = (qrData) => {
    return axios.get(`/bookings/verifyQr?token=${qrData}`);
}
const commitSwap = (data) => {
    return axios.post("/swaps/commit", data);
}
const checkBatteryModule = (data) => {
    return axios.post("/swaps/checkBatteryModel", data);
}
const cancelBooking = (data) => {
    return axios.post("/swaps/cancel", data);
}
const getSwapsByStation = (stationId) => {
    return axios.get(`/swaps?stationId=${stationId}`);
}

const getAllPlans = () => {
    return axios.get("/plans/all");
}

const getDriverSubscription = (UserId) => {
    return axios.get(`/plans/my-subscription?userId=${UserId}`);
}

const changeUserPhoneNumber = (newPhoneNumber) => {
    return axios.put("users/profile/change-phone", { newPhoneNumber });
}

const changeUserPassword = (oldPassword, newPassword, confirmPassword) => {
    return axios.post("/users/profile/change-password", { oldPassword, newPassword, confirmPassword });
}


const createInvoiceForSubscription = (planId, userId, paymentMethod) => {
    const data = { planId, userId, paymentMethod };
    return axios.post("/plans/subscribe", data);
}

const createVNpayForSubscription = (invoiceId) => {
    const data = {
        invoiceId: invoiceId,
        bankCode: "VNPAY",
        orderType: "Subscription"
    };
    return axios.post("/payments/vnpay/create-subscription", data);
}

const createTicket = (data) => {
    return axios.post("/staff/tickets", data);
}

const insertBatteryInventory = (slotId, batteryId) => {
    return axios.post(`/batteries/insert?slotId=${slotId}&batteryId=${batteryId}`);
}
const removeBatteryInventory = (batteryId) => {
    return axios.post(`/batteries/eject/${batteryId}`);
}
const batteryStatusUpdate = (batteryId, newStatus) => {
    const data = {
        batteryId: batteryId,
        newStatus: newStatus
    }
    return axios.patch(`/batteries/status`, data);
}
const forgotPasswordAPI = (email) => {
    return axios.post("/auth/forgot-password", { email });
}

const resetPasswordAPI = (token, newPassword, confirmPassword) => {
    return axios.post("/auth/reset-password", { token, newPassword, confirmPassword });
}

const getAllStaff = () => {
    return axios.get("/admin/staff/list");
}

const createStaffAccount = (name, email, password, stationId) => {
    const data = { name, email, password, stationId };
    return axios.post("/admin/staff", data);
}

const cancelStaffAssign = (staffId) => {
    return axios.delete(`/admin/staff/${staffId}/unassign`);
}

const assignStaff = (staffId, stationId) => {
    return axios.put(`/admin/staff/${staffId}`, { stationId });
}

const getStationsAndStaff = () => {
    return axios.get("/admin/staff");
}

const depositSystemWallet = (amount) => {
    const data = {
        amount,
        bankCode: "VNPAY",
        orderType: "wallet_topup"
    };
    return axios.post("/payments/vnpay/wallet/topup", data);
}
const getStationPerformanceReports = () => {
    return axios.get("/reports/station/performance");
}
const getWattingBatteryInventory = (stationId) => {
    return axios.get(`/batteries/waiting?stationId=${stationId}`);
}
const createInspection = (data) => {
    return axios.post("/staff/inspections", data);
}
const getInspectionByStaffId = (staffId) => {
    return axios.get(`/staff/inspections/staff/${staffId}`);
}

const getTicketByStationId = (stationId) => {
    return axios.get(`/staff/tickets/by-station?stationId=${stationId}`);
}

const updateTicketSolution = (ticketId, data) => {
    return axios.put(`staff/tickets/${ticketId}/resolve`, data);
}

const cancelAutoRenewSubscription = (userId) => {
    return axios.post("/plans/cancel", { userId });
}

const cancelSubscriptionImmediate = (userId) => {
    return axios.post("/plans/cancel-immediately", { userId });
}

const confirmCashPenalty = (ticketId, staffId) => {
    return axios.put(`/staff/tickets/${ticketId}/confirm-cash?staffId=${staffId}`);
}

const getSystemPriceAdmin = () => {
    return axios.get("/admin/system-prices");
}

const updateSystemPriceAdmin = (priceType, newPrice, description) => {
    const data = {
        price: newPrice,
        description: description
    }
    return axios.put(`/admin/system-prices/${priceType}`, data);
}
const swapHourlyReport = (starDate, endDate) => {
    return axios.get(`reports/swap/hourly?startDate=${starDate}&endDate=${endDate}`);
}
const swapDaylyReport = (starDate, endDate) => {
    return axios.get(`reports/swap/daily?startDate=${starDate}&endDate=${endDate}`);
}
const revenueHourlyReport = (starDate, endDate) => {
    return axios.get(`reports/revenue/hourly?startDate=${starDate}&endDate=${endDate}`);
}
const revenueDaylyReport = (starDate, endDate) => {
    return axios.get(`reports/revenue/daily?startDate=${starDate}&endDate=${endDate}`);
}

const getAllRebalance = () => {
    return axios.get("/rebalances");
}

const getAIRebalanceSuggestion = () => {
    return axios.get("/rebalances/suggestions");
};

const createARebalanceRequest = (data) => {
    return axios.post("/rebalances", data);
}

const updateRebalanceRequest = (rebalanceId, status) => {
    return axios.patch(`/rebalances/${rebalanceId}/status?status=${status}`);
};

const getStationReportByRangeDate = (stationId, range) => {
    return axios.get(`/reports/station/${stationId}/range?days=${range}`);
}


const getDriverDashboardReport = (driverId) => {
    return axios.get(`/dashboard?userId=${driverId}`);
}
const exportReportByRangeDate = (startDate,endDate ) => {
    return axios.get(`/reports/export/all?startDate=${startDate}&endDate=${endDate}`, { 
        responseType: 'blob', 
        headers:{
            Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        } 
    });
}

const getAllVehicles = () => {
    return axios.get("/admin/vehicles");
}

const importVehiclesCSV = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post("/admin/vehicles/import", formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
}

export {
    exportReportByRangeDate,
    getStationReportByRangeDate,
    swapHourlyReport,
    swapDaylyReport,
    revenueHourlyReport,
    revenueDaylyReport,
    getSystemPriceAdmin,
    updateSystemPriceAdmin,
    registerAPI,
    loginAPI,
    loginByGoogleAPI,
    forgotPasswordAPI,
    resetPasswordAPI,
    getInfoByToken,
    registerVehicleByVin,
    getVehicleInfoByVin,
    getUserAllVehicles,
    deactivateVehicleByVin,
    getAllStations,
    getStationNearbyLocation,
    verifyEmailAPI,
    resendEmailAPIbyToken,
    getBookingHistoryByUserId,
    getInvoiceById,
    cancelBookingById,
    getSwapDefaultPrice,
    createBookingForVehicles,
    createVNPayUrl,
    checkVNPayPaymentStatus,
    getInvoicebyUserId,
    generateQRBooking,
    verifyQrBooking,
    commitSwap,
    getSwapsByStation,
    cancelPendingInvoiceById,
    checkBatteryModule,
    cancelBooking,
    getAllPlans,
    getDriverSubscription,
    changeUserPhoneNumber,
    changeUserPassword,
    createInvoiceForSubscription,
    createVNpayForSubscription,
    createTicket,
    insertBatteryInventory,
    removeBatteryInventory,
    batteryStatusUpdate,
    getAllStaff,
    createStaffAccount,
    cancelStaffAssign,
    assignStaff,
    getStationsAndStaff,
    depositSystemWallet,
    getStationPerformanceReports,
    getWattingBatteryInventory,
    createInspection,
    getInspectionByStaffId,
    getTicketByStationId,
    updateTicketSolution,
    cancelAutoRenewSubscription,
    cancelSubscriptionImmediate,
    getStationById,
    confirmCashPenalty,
    getAllRebalance,
    getAIRebalanceSuggestion,
    createARebalanceRequest,
    updateRebalanceRequest,
    getDriverDashboardReport,
    getAllVehicles,
    importVehiclesCSV
};