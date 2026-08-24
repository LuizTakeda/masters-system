import { NavLink } from "react-router";
import { Home, Server } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const adminItems = [
  {
    title: "Home",
    url: "/dashboard/admin",
    icon: Home,
    end: true,
  },
  {
    title: "MQTT Broker",
    url: "/dashboard/admin/mqtt-broker",
    icon: Server,
    end: false,
  },
];

export function NavAdmin() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Administration</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {adminItems.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.title}>
                <NavLink to={item.url} end={item.end} className="w-full">
                  {({ isActive }) => (
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isActive}
                    >
                      <Icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
