import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { SystemContext } from "../contexts/system.context";
import { notification } from "antd";

const StaffPrivateRoute = (props) => {
    const { userData } = useContext(SystemContext);
    if (userData && userData.role === "staff") {
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
    // Người dùng vào /user → bị chuyển đến /login → history: [/login] (ghi đè /user)
    // Khi login xong, nhấn "Back" sẽ về trang trước /user (ví dụ home) → không bị loop
    return <Navigate to="/login" replace />;
}
export default StaffPrivateRoute;