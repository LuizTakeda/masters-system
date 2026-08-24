import { Outlet } from "react-router";
import { SidebarInset, SidebarProvider } from "../../components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { Toaster } from "@/components/ui/toast";

export default function DashboardProjectLayout() {
  return (
    <SidebarProvider >
      <AppSidebar />
      <SidebarInset className="bg-secondary">
        <Outlet />
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}