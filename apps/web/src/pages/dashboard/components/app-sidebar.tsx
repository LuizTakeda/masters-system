import { useMemo, useState } from "react";
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
  const [selectedContext, setSelectedContext] = useState<string | null>(null);

  const availableContexts = useMemo(() => {
    if (!user) return [];

    const contexts: string[] = [];

    if (user.roles.includes("system-admin")) {
      contexts.push("system-admin");
    }

    const projects = user.groups.filter((str) => str.includes("project"));
    contexts.push(...projects);

    return contexts;
  }, [user]);

  const currentContext = selectedContext ?? availableContexts.at(0) ?? null;

  if (isLoading || isError || !user) {
    return <SidebarSkeleton />;
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <ContextSwitcher
          setContext={setSelectedContext}
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