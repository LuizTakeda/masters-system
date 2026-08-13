import { Cpu, Wifi, EllipsisVerticalIcon, LogOutIcon, Home, ServerIcon, RadioReceiver } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "../../../components/ui/sidebar";
import { useMe } from "../../../hooks/use-me";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../../../components/ui/dropdown-menu";

export function AppSidebar() {
  const { isLoading, isError, user } = useMe();

  // 1. Estado de Carregamento (Skeleton Moderno)
  if (isLoading) {
    return (
      <Sidebar collapsible="icon" className="bg-sidebar border-0 shadow-none outline-0">
        <SidebarHeader className="h-[72px] flex items-center justify-center ">
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

  // 2. Estado de Erro ou Não Autenticado
  if (isError || !user) {
    return (
      <Sidebar collapsible="icon" className="border-r border-destructive/20 bg-background">
        <SidebarHeader className="h-[72px] flex items-center justify-center border-b border-destructive/20">
          <Cpu className="h-8 w-8 text-destructive opacity-50" />
        </SidebarHeader>
        <SidebarContent className="p-4 text-center flex flex-col items-center justify-center gap-2">
          <Wifi className="h-10 w-10 text-muted-foreground opacity-30" />
          <p className="text-sm font-medium text-destructive">Falha na conexão</p>
          <p className="text-xs text-muted-foreground">Não foi possível carregar o perfil IoT.</p>
        </SidebarContent>
      </Sidebar>
    );
  }

  const isAdmin = user.roles.includes("admin");

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Home />
                <span>Home</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenuButton>
              <ServerIcon />
              <span>
                MQTT Broker
              </span>
            </SidebarMenuButton>
            <SidebarMenuButton>
              <RadioReceiver />
              <span>
                Devices
              </span>
            </SidebarMenuButton>
          </SidebarGroupContent>
        </SidebarGroup>}

      </SidebarContent>

      <SidebarFooter >
        <NavUser name={user.name} email={user.email} />
      </SidebarFooter>
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
