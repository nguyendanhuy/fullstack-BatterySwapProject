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

export { registerAPI, loginAPI };