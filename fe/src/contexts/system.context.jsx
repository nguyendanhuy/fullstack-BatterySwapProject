import { createContext, useState } from "react";

export const SystemContext = createContext(null);

export const SystemProvider = (props) => {
    const [userData, setUserData] = useState({});
    const [userVehicles, setUserVehicles] = useState([]);
    const value = { userData, setUserData, userVehicles, setUserVehicles };
    console.log(">>> check userData in SystemProvider: ", userData);
    if (userData.role === "DRIVER") {
        console.log(">>> check userVehicles in SystemProvider: ", userVehicles);
    }
    return (
        <SystemContext.Provider value={value}>
            {props.children}
        </SystemContext.Provider >
    )
}