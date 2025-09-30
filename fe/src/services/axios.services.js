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
// Đăng ký xe mới, cần token ở header
const vehicleRegisterAPI = (vin, vehicleType, batteryType, token) => {
    const data = {
        vin,
        vehicleType,
        batteryType
    };
    return axios.post("/v1/vehicles/register", data, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
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
export { registerAPI, loginAPI, getInfoByToken, vehicleRegisterAPI };