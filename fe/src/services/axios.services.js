import axios from "./axios.config";

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

const createInvoiceForBookings = (data) => {
    return axios.post("/invoices/create-from-multiple-bookings", data)
}

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


const createInvoiceForSubscription = (planId, userId) => {
    const data = { planId, userId };
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

const createInspectionAndDispute = (data) => {
    return axios.post("/inspections", data);
}

const insertBatteryInventory = (slotId, batteryId) => {
    return axios.post(`/batteries/insert?slotId=${slotId}&batteryId=${batteryId}`);
}
const removeBatteryInventory = (batteryId) => {
    return axios.post(`/batteries/eject/${batteryId}`);
}
const batteryStatusUpdate = (batteryId,newStatus) =>{
    data={
        batteryId:batteryId,
        newStatus:newStatus
    }
    return axios.patch(`/batteries/status`,data);
}
const forgotPasswordAPI = (email) => {
    return axios.post("/auth/forgot-password", { email });
}

const resetPasswordAPI = (token, newPassword, confirmPassword) => {
    return axios.post("/auth/reset-password", { token, newPassword, confirmPassword });
}

export {
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
    createInvoiceForBookings,
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
    createInspectionAndDispute,
    insertBatteryInventory,
    removeBatteryInventory,
    batteryStatusUpdate
};