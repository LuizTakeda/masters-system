import { Outlet } from "react-router";
import { SidebarProvider } from "../../components/ui/sidebar";
import AppSideBar from "./components/app-side-bar";

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <AppSideBar />
      <div>
        <Outlet />
      </div>
    </SidebarProvider>
  );
}