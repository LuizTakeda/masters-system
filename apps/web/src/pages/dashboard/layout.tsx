import { Outlet } from "react-router";
import { SidebarProvider } from "../../components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div>
        <Outlet />
      </div>
    </SidebarProvider>
  );
}