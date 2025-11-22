import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { SystemContext } from "../contexts/system.context";
import { notification } from "antd";

const StaffPrivateRoute = (props) => {
    const { userData } = useContext(SystemContext);
    if (userData && userData.role === "STAFF") {
        return (
            <>
                {props.children}
            </>
        )
    } else {
        notification.error({
            message: 'Access Denied',
            description: 'You do not have permission to access this page.',
            placement: 'bottomRight',
        });
    }
    // Show notification when access is denied
    return <Navigate to="/login" replace />;
}
export default StaffPrivateRoute;