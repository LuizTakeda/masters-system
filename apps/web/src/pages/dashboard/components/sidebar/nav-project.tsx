import { NavLink } from "react-router";
import { Layers } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type Props = {
  project: string;
};

export function NavProject({ project }: Props) {
  const projectLabel = project.replace(/^project-?/, "") || project;

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="capitalize">{projectLabel}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <NavLink to={`/dashboard/project/${project}/context`} className="w-full">
              {({ isActive }) => (
                <SidebarMenuButton
                  tooltip="Context"
                  isActive={isActive}
                >
                  <Layers className="size-4" />
                  <span>Context</span>
                </SidebarMenuButton>
              )}
            </NavLink>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

