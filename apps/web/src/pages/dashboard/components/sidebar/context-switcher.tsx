import { useNavigate } from "react-router";
import { ChevronsUpDown, Check, FolderGit2, LayoutDashboard, Shield } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  currentContext: string | null;
  contexts: string[];
};

function formatContextLabel(context: string | null) {
  if (!context) {
    return "Overview";
  }
  if (context === "system-admin") {
    return "System Admin";
  }
  if (context.startsWith("project-")) {
    return `Project: ${context.replace(/^project-/, "").toUpperCase()}`;
  }
  return context;
}

export function ContextSwitcher({ contexts, currentContext }: Props) {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();

  const isSystemAdmin = currentContext === "system-admin";
  const isNoContext = currentContext === null;

  const handleSelectContext = (context: string | null) => {
    if (!context) {
      navigate("/dashboard");
    } else if (context === "system-admin") {
      navigate("/dashboard/admin");
    } else {
      navigate(`/dashboard/${encodeURIComponent(context)}`);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                tooltip={formatContextLabel(currentContext)}
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              />
            }
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0 shadow-xs">
              {isNoContext ? (
                <LayoutDashboard className="size-4" />
              ) : isSystemAdmin ? (
                <Shield className="size-4" />
              ) : (
                <FolderGit2 className="size-4" />
              )}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate text-xs text-muted-foreground font-medium">Workspace</span>
              <span className="truncate font-semibold text-foreground">
                {formatContextLabel(currentContext)}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Navigation
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => handleSelectContext(null)}
                className="gap-2.5 p-2 cursor-pointer"
              >
                <div className="flex size-7 items-center justify-center rounded-md border bg-muted shrink-0 text-foreground">
                  <LayoutDashboard className="size-3.5 text-muted-foreground" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Overview</span>
                  <span className="truncate text-[10px] text-muted-foreground">Dashboard home</span>
                </div>
                {isNoContext && <Check className="size-4 text-primary ml-auto" />}
              </DropdownMenuItem>
            </DropdownMenuGroup>

            {contexts.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Available Workspaces
                  </DropdownMenuLabel>
                  {contexts.map((ctx) => {
                    const isSelected = ctx === currentContext;
                    const isSys = ctx === "system-admin";

                    return (
                      <DropdownMenuItem
                        key={ctx}
                        onClick={() => handleSelectContext(ctx)}
                        className="gap-2.5 p-2 cursor-pointer"
                      >
                        <div className="flex size-7 items-center justify-center rounded-md border bg-muted shrink-0 text-foreground">
                          {isSys ? (
                            <Shield className="size-3.5 text-primary" />
                          ) : (
                            <FolderGit2 className="size-3.5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-medium">{formatContextLabel(ctx)}</span>
                          <span className="truncate text-[10px] text-muted-foreground">{ctx}</span>
                        </div>
                        {isSelected && <Check className="size-4 text-primary ml-auto" />}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuGroup>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
