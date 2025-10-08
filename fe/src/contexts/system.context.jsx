import { createContext, useState } from "react";

export const SystemContext = createContext(null);

export const SystemProvider = (props) => {
    const [userData, setUserData] = useState(
        {
            email: "",
            fullName: "",
            role: "",
            userId: "",
        });
    const [userVehicles, setUserVehicles] = useState(
        {}
    );
    const value = { userData, setUserData, userVehicles, setUserVehicles };
    console.log(">>> check userData in SystemProvider: ", userData);
    return (
        <SystemContext.Provider value={value}>
            {props.children}
        </SystemContext.Provider >
    )
}