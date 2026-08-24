import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export function SidebarSkeleton() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-2">
        <div className="flex items-center gap-2 p-2">
          <Skeleton className="size-8 rounded-lg shrink-0" />
          <div className="flex-1 space-y-1 group-data-[collapsible=icon]:hidden">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2 space-y-4">
        {/* Navigation Item Skeleton */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 p-2">
            <Skeleton className="size-4 rounded shrink-0" />
            <Skeleton className="h-4 w-20 group-data-[collapsible=icon]:hidden" />
          </div>
        </div>

        {/* Group Section Skeleton */}
        <div className="space-y-2">
          <div className="px-2 group-data-[collapsible=icon]:hidden">
            <Skeleton className="h-3 w-14" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 p-2">
              <Skeleton className="size-4 rounded shrink-0" />
              <Skeleton className="h-4 w-28 group-data-[collapsible=icon]:hidden" />
            </div>
            <div className="flex items-center gap-2 p-2">
              <Skeleton className="size-4 rounded shrink-0" />
              <Skeleton className="h-4 w-24 group-data-[collapsible=icon]:hidden" />
            </div>
          </div>
        </div>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 p-2">
              <Skeleton className="size-8 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1 group-data-[collapsible=icon]:hidden">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

