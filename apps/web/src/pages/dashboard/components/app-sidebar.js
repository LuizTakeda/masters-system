import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Cpu, Wifi, EllipsisVerticalIcon, LogOutIcon, Home, ServerIcon, RadioReceiver, ChevronsUpDown, Plus } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from "../../../components/ui/sidebar";
import { useMe } from "../../../hooks/use-me";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from "../../../components/ui/dropdown-menu";
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
export function AppSidebar() {
    const { isLoading, isError, user } = useMe();
    const [selectedContext, setSelectedContext] = useState(null);
    const availableContexts = useMemo(() => {
        if (!user)
            return [];
        const contexts = [];
        if (user.roles.includes("system-admin")) {
            contexts.push("system-admin");
        }
        const projects = user.groups.filter((str) => str.includes("project"));
        contexts.push(...projects);
        return contexts;
    }, [user]);
    const currentContext = selectedContext ?? availableContexts.at(0) ?? null;
    if (isLoading || isError || !user) {
        return _jsx(LoadingAppSideBar, {});
    }
    return (_jsxs(Sidebar, { collapsible: "icon", children: [_jsx(SidebarHeader, { children: _jsx(ContextSwitcher, { setContext: setSelectedContext, currentContext: currentContext, contexts: availableContexts }) }), _jsxs(SidebarContent, { children: [_jsx(SidebarGroup, { children: _jsx(SidebarGroupContent, { children: _jsx(Link, { to: "/dashboard", children: _jsx(SidebarMenuItem, { children: _jsxs(SidebarMenuButton, { children: [_jsx(Home, {}), _jsx("span", { children: "Home" })] }) }) }) }) }), currentContext === "system-admin" && _jsx(AdminSidebarGroup, {}), currentContext && currentContext !== "system-admin" && _jsx(ProjectSidebarGroup, { project: currentContext })] }), _jsx(SidebarFooter, { children: _jsx(NavUser, { name: user.name, email: user.email }) })] }));
}
function LoadingAppSideBar() {
    return (_jsxs(Sidebar, { collapsible: "icon", className: "bg-sidebar border-0 shadow-none outline-0", children: [_jsx(SidebarHeader, { className: "h-18 flex items-center justify-center ", children: _jsx("div", { className: "h-10 w-10 animate-pulse rounded-full bg-muted" }) }), _jsxs(SidebarContent, { className: "p-2 space-y-4", children: [_jsx("div", { className: "h-10 w-full animate-pulse rounded-md bg-muted" }), _jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "h-4 w-20 animate-pulse rounded bg-muted/60" }), _jsx("div", { className: "h-12 w-full animate-pulse rounded-md bg-muted" }), _jsx("div", { className: "h-12 w-full animate-pulse rounded-md bg-muted" })] })] })] }));
}
function NavUser(props) {
    const { isMobile } = useSidebar();
    return (_jsx(SidebarMenu, { children: _jsx(SidebarMenuItem, { children: _jsxs(DropdownMenu, { children: [_jsxs(DropdownMenuTrigger, { render: _jsx(SidebarMenuButton, { size: "lg", className: "aria-expanded:bg-muted" }), children: [_jsx(Avatar, { className: "size-8 rounded-lg grayscale", children: _jsx(AvatarFallback, { className: "rounded-lg", children: props.name.split(" ").map((str) => str[0]).slice(0, 2) }) }), _jsxs("div", { className: "grid flex-1 text-left text-sm leading-tight", children: [_jsx("span", { className: "truncate font-medium", children: props.name }), _jsx("span", { className: "truncate text-xs text-foreground/70", children: props.email })] }), _jsx(EllipsisVerticalIcon, { className: "ml-auto size-4" })] }), _jsxs(DropdownMenuContent, { className: "min-w-56", side: isMobile ? "bottom" : "right", align: "end", sideOffset: 4, children: [_jsx(DropdownMenuGroup, { children: _jsx(DropdownMenuLabel, { className: "p-0 font-normal", children: _jsxs("div", { className: "flex items-center gap-2 px-1 py-1.5 text-left text-sm", children: [_jsx(Avatar, { className: "size-8", children: _jsx(AvatarFallback, { className: "rounded-lg", children: props.name.split(" ").map((str) => str[0]).slice(0, 2) }) }), _jsxs("div", { className: "grid flex-1 text-left text-sm leading-tight", children: [_jsx("span", { className: "truncate font-medium", children: props.name }), _jsx("span", { className: "truncate text-xs text-muted-foreground", children: props.email })] })] }) }) }), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { children: [_jsx(LogOutIcon, {}), "Log out"] })] })] }) }) }));
}
export function ContextSwitcher({ contexts, currentContext, setContext }) {
    if (currentContext === null) {
        return null;
    }
    return (_jsx(SidebarMenu, { children: _jsx(SidebarMenuItem, { children: _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { render: _jsxs(SidebarMenuButton, { size: "lg", className: "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground", children: [_jsxs("div", { className: "grid flex-1 text-left text-sm leading-tight", children: [_jsx("span", { className: "truncate text-xs", children: "Context" }), _jsx("span", { className: "truncate font-medium", children: currentContext })] }), _jsx(ChevronsUpDown, { className: "ml-auto" })] }) }), _jsx(DropdownMenuContent, { className: "w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg", align: "start", side: "bottom", sideOffset: 4, children: _jsxs(DropdownMenuGroup, { children: [_jsx(DropdownMenuLabel, { className: "text-xs text-muted-foreground", children: "Contexts" }), contexts.map((context) => (_jsx(DropdownMenuItem, { onClick: () => setContext(context), className: "gap-2 p-2", children: context }, context)))] }) })] }) }) }));
}
function AdminSidebarGroup() {
    return (_jsxs(SidebarGroup, { children: [_jsx(SidebarGroupLabel, { children: "Admin" }), _jsxs(SidebarGroupContent, { children: [_jsx(Link, { to: "/dashboard/admin/mqtt-broker", children: _jsxs(SidebarMenuButton, { children: [_jsx(ServerIcon, {}), _jsx("span", { children: "MQTT Broker" })] }) }), _jsxs(SidebarMenuButton, { children: [_jsx(RadioReceiver, {}), _jsx("span", { children: "Devices" })] })] })] }));
}
function ProjectSidebarGroup(props) {
    return (_jsx(SidebarGroup, {}));
}
