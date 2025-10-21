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
    if (!vin) throw new Error("VIN is required");
    return axios.post(`/v1/vehicles/assign`, { vin });
}
const viewUserVehicles = () => {
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
    return axios.get("/system-price/current");
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
const generateQRBooking = (bookingId) => {
    return axios.get(`/bookings/${bookingId}/generateQr`);
}
const verifyQrBooking = (qrData) => {
    return axios.get(`/bookings/verifyQr?token=${qrData}`);
}
const commitSwap = (data) => {
    return axios.post("/swaps/commit", data);
}
export {
    registerAPI,
    loginAPI,
    loginByGoogleAPI,
    getInfoByToken,
    registerVehicleByVin,
    getVehicleInfoByVin,
    viewUserVehicles,
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
    commitSwap
};