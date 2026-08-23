import { EllipsisVerticalIcon, LogOutIcon, Home, ServerIcon, RadioReceiver, ChevronsUpDown } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from "../../../components/ui/sidebar";
import { useMe } from "../../../hooks/use-me";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../../../components/ui/dropdown-menu";
import { useMemo, useState } from "react";
import { Link } from "react-router";

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
    return <LoadingAppSideBar />;
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <ContextSwitcher setContext={setSelectedContext} currentContext={currentContext} contexts={availableContexts} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <Link to="/dashboard">
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Home />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </Link>
          </SidebarGroupContent>
        </SidebarGroup>
        {currentContext === "system-admin" && <AdminSidebarGroup />}
        {currentContext && currentContext !== "system-admin" && <ProjectSidebarGroup project={currentContext} />}
      </SidebarContent>
      <SidebarFooter >
        <NavUser name={user.name} email={user.email} />
      </SidebarFooter>
    </Sidebar>
  );
}

function LoadingAppSideBar() {
  return (
    <Sidebar collapsible="icon" className="bg-sidebar border-0 shadow-none outline-0">
      <SidebarHeader className="h-18 flex items-center justify-center ">
        <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
      </SidebarHeader>
      <SidebarContent className="p-2 space-y-4">
        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-20 animate-pulse rounded bg-muted/60" />
          <div className="h-12 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-12 w-full animate-pulse rounded-md bg-muted" />
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

function NavUser(props: { name: string, email: string }) {
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            <Avatar className="size-8 rounded-lg grayscale">
              <AvatarFallback className="rounded-lg">{props.name.split(" ").map((str) => str[0]).slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{props.name}</span>
              <span className="truncate text-xs text-foreground/70">
                {props.email}
              </span>
            </div>
            <EllipsisVerticalIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="size-8">
                    <AvatarFallback className="rounded-lg">{props.name.split(" ").map((str) => str[0]).slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{props.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {props.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOutIcon
              />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function ContextSwitcher({
  contexts,
  currentContext,
  setContext
}: {
  currentContext: string | null,
  contexts: string[],
  setContext: (context: string) => void
}) {

  if (currentContext === null) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate text-xs">Context</span>
                  <span className="truncate font-medium">{currentContext}</span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Contexts
              </DropdownMenuLabel>
              {contexts.map((context) => (
                <DropdownMenuItem
                  key={context}
                  onClick={() => setContext(context)}
                  className="gap-2 p-2"
                >
                  {context}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function AdminSidebarGroup() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Admin</SidebarGroupLabel>
      <SidebarGroupContent>
        <Link to="/dashboard/admin/mqtt-broker" >
          <SidebarMenuButton>
            <ServerIcon />
            <span>
              MQTT Broker
            </span>
          </SidebarMenuButton>
        </Link>
        <SidebarMenuButton>
          <RadioReceiver />
          <span>
            Devices
          </span>
        </SidebarMenuButton>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function ProjectSidebarGroup(props: { project: string }) {


  return (
    <SidebarGroup>
      <>{props.project}</>
    </SidebarGroup>
  );
}