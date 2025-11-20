import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
    SidebarHeader,
    useSidebar,
} from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AccountSettings from "@/components/AccountSettings";
import { Home, FileText, Battery, Users, Settings, LogOut, PanelLeft, PanelLeftClose, Car } from "lucide-react";

const mainItems = [
    { title: "Dashboard", url: "/admin", icon: Home },
    { title: "Báo cáo", url: "/admin/reports", icon: FileText },
    { title: "Điều phối pin", url: "/admin/battery-dispatch", icon: Battery },
    { title: "Quản lý nhân viên", url: "/admin/staff-management", icon: Users },
    { title: "Quản lý xe", url: "/admin/vehicle-management", icon: Car },
    { title: "Quản lý giá", url: "/admin/price-management", icon: FileText },
];
export function MobileBottomAdminNav() {
    return (
        <div className="fixed bottom-0 left-0 w-full h-16 bg-white border-t shadow-lg flex justify-around items-center md:hidden z-50">
            {mainItems.map((item) => (
                <NavLink
                    key={item.title}
                    to={item.url}
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center text-xs ${isActive ? "text-blue-600" : "text-gray-500"
                        }`
                    }
                >
                    <item.icon className="h-5 w-5" />
                    <span className="text-[11px]">{item.title}</span>
                </NavLink>
            ))}
        </div>
    );
}
export function AdminSidebar() {
    const { open, toggleSidebar } = useSidebar();
    const navigate = useNavigate();
    const [settingsOpen, setSettingsOpen] = useState(false);

    const handleLogout = () => {
        try { localStorage.removeItem("token"); } catch { }
        navigate("/login");
    };

    return (
        <>
            <div className="[--sidebar-width:230px] [--sidebar-width-icon:60px] hidden md:block">
                <Sidebar className="border-r border-white/10 transition-all duration-300"
                    collapsible="icon">
                    <div className="h-full bg-gradient-to-b from-blue-600 via-indigo-600 to-purple-600 flex flex-col">
                        {/* Header */}
                        <SidebarHeader className="border-b border-white/10 p-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleSidebar}
                                className="text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
                            >
                                {open ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
                            </Button>
                        </SidebarHeader>

                        {/* Main menu */}
                        <SidebarContent className="flex-1 overflow-y-auto">
                            <SidebarGroup>
                                <SidebarGroupLabel className={`text-white/70 text-sm font-semibold uppercase tracking-wider px-3 mb-3 ${!open && "opacity-0"}`}>
                                    Menu chính
                                </SidebarGroupLabel>

                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {mainItems.map((item) => (
                                            <SidebarMenuItem key={item.title}>
                                                <NavLink
                                                    to={item.url}
                                                    end={item.url === "/admin"}
                                                    className={({ isActive }) => `
                              flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-base font-medium
                              ${isActive ? "bg-white/25 text-white font-semibold shadow-inner" : "text-white/85 hover:text-white hover:bg-white/10"}
                            `}
                                                >
                                                    <item.icon className="h-5 w-5" />
                                                    {open && <span>{item.title}</span>}
                                                </NavLink>
                                            </SidebarMenuItem>
                                        ))}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        </SidebarContent>

                        {/* Footer */}
                        <SidebarFooter className="border-t border-white/10 p-2 mt-auto">
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        onClick={() => setSettingsOpen(true)}
                                        tooltip="Cài đặt"
                                        className="text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer text-base font-medium"
                                    >
                                        <Settings className="h-5 w-5" />
                                        {open && <span>Cài đặt</span>}
                                    </SidebarMenuButton>
                                </SidebarMenuItem>

                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        onClick={handleLogout}
                                        tooltip="Đăng xuất"
                                        className="text-white/90 hover:text-white hover:bg-red-500/20 transition-all duration-200 cursor-pointer text-base font-medium"
                                    >
                                        <LogOut className="h-5 w-5" />
                                        {open && <span>Đăng xuất</span>}
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarFooter>
                    </div>
                </Sidebar>
            </div>

            {/* Settings Dialog */}
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">Cài đặt tài khoản</DialogTitle>
                    </DialogHeader>
                    <AccountSettings userRole="admin" />
                </DialogContent>
            </Dialog>
        </>
    );
}

export default AdminSidebar;
