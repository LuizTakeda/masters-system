import { Outlet } from "react-router";
import { SidebarInset, SidebarProvider } from "../../components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";

export default function DashboardLayout() {
  return (
    <SidebarProvider >
      <AppSidebar/>
      <SidebarInset className="bg-secondary">
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}