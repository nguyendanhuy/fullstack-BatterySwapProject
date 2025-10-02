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

const registerVehicleByVin = (vin, token) => {
    if (!vin) throw new Error("VIN is required");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return axios.post(`/v1/vehicles/assign`, { vin }, { headers });
}

export { registerAPI, loginAPI, getInfoByToken, registerVehicleByVin, getVehicleInfoByVin };