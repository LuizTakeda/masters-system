import { NavLink } from "react-router";
import { Home } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavMain() {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <NavLink to="/dashboard" end className="w-full">
              {({ isActive }) => (
                <SidebarMenuButton
                  tooltip="Home"
                  isActive={isActive}
                >
                  <Home className="size-4" />
                  <span>Home</span>
                </SidebarMenuButton>
              )}
            </NavLink>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

