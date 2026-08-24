import { useMemo } from "react";
import { useLocation } from "react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useMe } from "@/hooks/use-me";
import { ContextSwitcher } from "./sidebar/context-switcher";
import { NavMain } from "./sidebar/nav-main";
import { NavAdmin } from "./sidebar/nav-admin";
import { NavProject } from "./sidebar/nav-project";
import { NavUser } from "./sidebar/nav-user";
import { SidebarSkeleton } from "./sidebar/sidebar-skeleton";

export function AppSidebar() {
  const { isLoading, isError, user } = useMe();
  const location = useLocation();

  const availableContexts = useMemo(() => {
    if (!user) return [];

    const contexts: string[] = [];

    if (user.roles.includes("system-admin")) {
      contexts.push("system-admin");
    }

    const projects = user.groups.filter((str) => str.startsWith("project-"));
    contexts.push(...projects);

    return contexts;
  }, [user]);

  // Derive active context directly from the current URL path
  // If the user is on /dashboard, context is null (No context / Overview)
  const currentContext = useMemo(() => {
    const pathname = location.pathname;

    if (pathname.startsWith("/dashboard/admin")) {
      return "system-admin";
    }

    const projectMatch = pathname.match(/^\/dashboard\/([^/]+)/);
    if (projectMatch && projectMatch[1]) {
      return decodeURIComponent(projectMatch[1]);
    }

    // Default to null (Overview / General dashboard)
    return null;
  }, [location.pathname]);

  if (isLoading || isError || !user) {
    return <SidebarSkeleton />;
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <ContextSwitcher
          currentContext={currentContext}
          contexts={availableContexts}
        />
      </SidebarHeader>

      <SidebarContent>
        <NavMain />
        {currentContext === "system-admin" && <NavAdmin />}
        {currentContext && currentContext !== "system-admin" && (
          <NavProject project={currentContext} />
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavUser name={user.name} email={user.email} />
      </SidebarFooter>
    </Sidebar>
  );
}