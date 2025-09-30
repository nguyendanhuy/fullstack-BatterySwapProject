import { useContext, useEffect, useState } from "react";
import { SystemContext } from "../contexts/system.context";
import { getInfoByToken } from "../services/axios.services";

const AuthProvider = ({ children }) => {
    const { userData, setUserData } = useContext(SystemContext);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const fetchUserInfo = async () => {
        try {
            setIsLoading(true);

            // Check if there's a token in localStorage
            const token = localStorage.getItem("token");

            if (token) {
                const res = await getInfoByToken();
                if (res) {
                    setUserData(res);
                }
            }
        } catch (error) {
            console.error("Error fetching user info:", error);
            // Clear invalid token
            localStorage.removeItem("token");
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading spinner while fetching user info
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-blue"></div>
            </div>
        );
    }

    return children;
};

export default AuthProvider;