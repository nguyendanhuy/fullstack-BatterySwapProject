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
const getInfoByToken = () => {
    return axios.get("/auth/me",);
}


const getVehicleInfoByVin = (vin) => {
    return axios.get(`/v1/vehicles/${vin}`);
};

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
export {
    registerAPI,
    loginAPI,
    getInfoByToken,
    registerVehicleByVin,
    getVehicleInfoByVin,
    viewUserVehicles,
    deactivateVehicleByVin,
    getAllStations,
    getStationNearbyLocation
};