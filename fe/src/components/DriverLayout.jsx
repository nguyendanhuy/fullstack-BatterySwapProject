import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DriverSidebar } from "@/components/DriverSidebar";
import { Menu } from "lucide-react";
import { Outlet } from "react-router-dom";

export function DriverLayout() {
    return (
        <SidebarProvider defaultOpen={true}>
            <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                <DriverSidebar />
                <main className="flex-1">
                    <Outlet />
                </main>
            </div>
        </SidebarProvider>
    );
}
