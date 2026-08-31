import { NavLink } from "react-router";
import { Home } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type Props = {
  project: string;
};

export function NavProject({ project }: Props) {
  const projectItems = [
    {
      title: "Home",
      url: `/dashboard/${encodeURIComponent(project)}`,
      icon: Home,
      end: true,
    },
  ];

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {projectItems.map((item) => {
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
