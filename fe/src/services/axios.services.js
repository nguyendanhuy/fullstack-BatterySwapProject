import axios from "./axios.config";
const registerAPI=(fullName, email, phone, address, password, roleId)=>{
    const data={
        fullName: fullName, 
        email: email, 
        phone: phone, 
        address: address, 
        password: password, 
        roleId: roleId
    }
    return axios.post("/auth/register", data);
}
export {registerAPI};