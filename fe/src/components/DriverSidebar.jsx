import { Home, Car, MapPin, Calendar, History, Battery, CreditCard, Settings, LogOut, PanelLeftClose, PanelLeft } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
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
    useSidebar,
    SidebarHeader,
} from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AccountSettings from "@/components/AccountSettings";

const mainItems = [
    { title: "Dashboard", url: "/driver", icon: Home },
    { title: "Đăng ký xe", url: "/driver/register-vehicle", icon: Car },
    { title: "Tìm trạm", url: "/driver/find-stations", icon: MapPin },
    { title: "Đặt lịch", url: "/driver/reservation", icon: Calendar },
    { title: "Lịch sử", url: "/driver/booking-history", icon: History },
    { title: "Gói thuê pin", url: "/driver/subscriptions", icon: Battery },
    { title: "Thanh toán", url: "/driver/payment", icon: CreditCard },
];

export function DriverSidebar() {
    const { open, toggleSidebar } = useSidebar();
    const navigate = useNavigate();
    const [settingsOpen, setSettingsOpen] = useState(false);

    const handleLogout = () => {
        navigate("/login");
    };

    return (
        <>
            <Sidebar
                className="border-r border-white/10 transition-all duration-300"
                style={{ width: open ? "200px" : "60px" }}
                collapsible="icon"
            >
                <div className="h-full bg-gradient-to-b from-blue-600 via-indigo-600 to-purple-600">
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
                    <SidebarContent className="pt-6">
                        <SidebarGroup>
                            <SidebarGroupLabel className={`text-white/70 text-xs uppercase tracking-wider px-3 mb-2 ${!open && "opacity-0"}`}>
                                Menu chính
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {mainItems.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton
                                                asChild
                                                tooltip={item.title}
                                                className="text-white/90 hover:text-white hover:bg-white/10 data-[active=true]:bg-blue-700 data-[active=true]:text-white transition-all duration-200"
                                            >
                                                <NavLink to={item.url} end={item.url === "/driver"}>
                                                    <item.icon className="h-5 w-5" />
                                                    {open && <span className="animate-fade-in">{item.title}</span>}
                                                </NavLink>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>

                    <SidebarFooter className="border-t border-white/10 p-2">
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    onClick={() => setSettingsOpen(true)}
                                    tooltip="Cài đặt"
                                    className="text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer"
                                >
                                    <Settings className="h-5 w-5" />
                                    {open && <span className="animate-fade-in">Cài đặt</span>}
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    onClick={handleLogout}
                                    tooltip="Đăng xuất"
                                    className="text-white/90 hover:text-white hover:bg-red-500/20 transition-all duration-200 cursor-pointer"
                                >
                                    <LogOut className="h-5 w-5" />
                                    {open && <span className="animate-fade-in">Đăng xuất</span>}
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarFooter>
                </div>
            </Sidebar>

            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Cài đặt tài khoản</DialogTitle>
                    </DialogHeader>
                    <AccountSettings userRole="driver" />
                </DialogContent>
            </Dialog>
        </>
    );
}   