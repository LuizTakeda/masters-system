import { Outlet } from "react-router";
import { SidebarProvider } from "../../components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { useEffect } from "react";
import { apiFetch } from "../../lib/api";

export default function DashboardLayout() {
  useEffect(() => {
    apiFetch("/api/auth/me").then((response) => {
      console.log("Then response", response);
    }).catch((error) => {
      console.log("Cath error", error);
    });

  }, []);

  return (
    <SidebarProvider>
      <div>
        <Outlet />
      </div>
    </SidebarProvider>
  );
}