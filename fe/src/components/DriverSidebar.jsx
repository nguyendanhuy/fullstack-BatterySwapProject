import {
    Home, Car, MapPin, History, Battery, CreditCard,
    Settings, LogOut, PanelLeftClose, PanelLeft,
    FileText, Wallet
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import AccountSettings from "@/components/AccountSettings";
import { SystemContext } from "@/contexts/system.context";

const mainItems = [
    { title: "Dashboard", url: "/driver", icon: Home },
    { title: "Đăng ký xe", url: "/driver/register-vehicle", icon: Car },
    { title: "Tìm trạm", url: "/driver/find-stations", icon: MapPin },
    { title: "Lịch sử", url: "/driver/booking-history", icon: History },
    { title: "Gói thuê pin", url: "/driver/subscriptions", icon: Battery },
    { title: "Hóa đơn", url: "/driver/invoices", icon: FileText },
    { title: "Ví điện tử", url: "/driver/wallet", icon: Wallet },
];

export function MobileBottomDriveNav() {
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

export function DriverSidebar() {
    const { open, toggleSidebar } = useSidebar();
    const { userData } = useContext(SystemContext);
    const navigate = useNavigate();
    const [settingsOpen, setSettingsOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login")
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0);
    };

    return (
        <div className="hidden md:block ">
            <Sidebar
                className="border-r border-white/10 transition-all duration-300"
                style={{ width: open ? "220px" : "60px" }}
                collapsible="icon"
            >
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

                    {/* Menu chính */}
                    <SidebarContent className="flex-1 overflow-y-auto">
                        <SidebarGroup>
                            <SidebarGroupLabel
                                className={`text-white/70 text-sm font-semibold uppercase tracking-wider px-3 mb-3 ${!open && "opacity-0"}`}
                            >
                                Menu chính
                            </SidebarGroupLabel>

                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {mainItems.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            {item.title === "Ví điện tử" ? (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <NavLink
                                                            to={item.url}
                                                            className={({ isActive }) =>
                                                                `
                                                                    flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-base font-medium
                                                                    ${isActive
                                                                    ? "bg-white/25 text-white font-semibold shadow-inner"
                                                                    : "text-white/85 hover:text-white hover:bg-white/10"}
                                                                    `
                                                            }
                                                        >
                                                            <item.icon className="h-5 w-5" />
                                                            {open && <span>{item.title}</span>}
                                                        </NavLink>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="right" className="bg-white text-gray-900 border border-gray-200 shadow-lg">
                                                        <div className="flex flex-col gap-1">
                                                            <p className="text-xs text-gray-500">Số dư ví</p>
                                                            <p className="text-sm font-bold text-green-600">
                                                                {formatCurrency(userData?.walletBalance)}
                                                            </p>
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            ) : item.title === "Gói thuê pin" ? (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <NavLink
                                                            to={item.url}
                                                            className={({ isActive }) =>
                                                                `
                                                                    flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-base font-medium
                                                                    ${isActive
                                                                    ? "bg-white/25 text-white font-semibold shadow-inner"
                                                                    : "text-white/85 hover:text-white hover:bg-white/10"}
                                                                    `
                                                            }
                                                        >
                                                            <item.icon className="h-5 w-5" />
                                                            {open && <span>{item.title}</span>}
                                                        </NavLink>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="right" className="bg-white text-gray-900 border border-gray-200 shadow-lg">
                                                        <div className="flex flex-col gap-1">
                                                            <p className="text-xs text-gray-500">Gói đăng ký của bạn</p>
                                                            <p className="text-sm font-bold text-green-600">
                                                                {userData?.activeSubscriptionId ? `Gói ${userData.planName} : Còn ${userData.maxSwaps - userData.usedSwaps} lượt` : "Chưa có gói"}
                                                            </p>
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            ) : (
                                                <NavLink
                                                    to={item.url}
                                                    end={item.url === "/driver"}
                                                    className={({ isActive }) =>
                                                        `
                                                        flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-base font-medium
                                                        ${isActive
                                                            ? "bg-white/25 text-white font-semibold shadow-inner"
                                                            : "text-white/85 hover:text-white hover:bg-white/10"}
                                                        `
                                                    }
                                                >
                                                    <item.icon className="h-5 w-5" />
                                                    {open && <span>{item.title}</span>}
                                                </NavLink>
                                            )}
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

            {/* Dialog Cài đặt */}
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">Cài đặt tài khoản</DialogTitle>
                    </DialogHeader>
                    <AccountSettings userRole="driver" />
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default DriverSidebar;
