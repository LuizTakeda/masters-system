import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Info, Trash2, Users } from "lucide-react";
import type { GetGroupsResponseType } from "@repo/types/endpoints/mqtt/group";

type GroupItem = NonNullable<GetGroupsResponseType["groups"]>[number];

type Props = {
  groups?: GroupItem[];
  isLoading: boolean;
  isError: unknown;
  onSelectGroup: (group: GroupItem) => void;
  onDeleteGroup: (group: GroupItem) => void;
};

const SYSTEM_GROUPS = ["admin"];

export function GroupsTable({
  groups,
  isLoading,
  isError,
  onSelectGroup,
  onDeleteGroup,
}: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-1/4">Group Name</TableHead>
          <TableHead className="w-1/4">Description</TableHead>
          <TableHead className="max-w-[240px]">Roles</TableHead>
          <TableHead className="w-28 text-center">Members</TableHead>
          <TableHead className="w-24 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Skeleton className="size-7 rounded-md shrink-0" />
                  <Skeleton className="h-5 w-28" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-40" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-5 w-16 mx-auto rounded-full" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-8 w-16 ml-auto rounded-md" />
              </TableCell>
            </TableRow>
          ))
        ) : isError ? (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
              Failed to load groups.
            </TableCell>
          </TableRow>
        ) : !groups || groups.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
              No groups found.
            </TableCell>
          </TableRow>
        ) : (
          groups.map((group) => {
            const isSystem = SYSTEM_GROUPS.includes(group.groupname);
            const memberCount = group.clients?.length ?? 0;

            return (
              <TableRow key={group.groupname} className="hover:bg-muted/40 transition-colors">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md shrink-0 flex items-center justify-center bg-primary/10 text-primary border border-primary/20">
                      <Users className="size-4" />
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-foreground truncate leading-tight">
                        {group.groupname}
                      </span>
                      {isSystem && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          System
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="text-sm">
                  {group.textdescription ? (
                    <span className="text-muted-foreground line-clamp-1">{group.textdescription}</span>
                  ) : group.textname ? (
                    <span className="text-muted-foreground">{group.textname}</span>
                  ) : (
                    <span className="italic text-muted-foreground/50 text-xs">No description</span>
                  )}
                </TableCell>

                <TableCell className="max-w-[240px]">
                  {group.roles && group.roles.length > 0 ? (
                    <div className="flex flex-wrap gap-1 max-h-14 max-w-[240px] overflow-y-auto pr-1">
                      {group.roles.map((r) => (
                        <span
                          key={r.rolename}
                          className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-primary/10 text-primary border border-primary/20 shrink-0 whitespace-nowrap"
                        >
                          {r.rolename}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="italic text-muted-foreground/50 text-xs">No roles</span>
                  )}
                </TableCell>

                <TableCell className="text-center">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border">
                    <Users className="size-3 opacity-60" />
                    <span>{memberCount} {memberCount === 1 ? "client" : "clients"}</span>
                  </span>
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onSelectGroup(group)}
                      title="View details"
                    >
                      <Info className="size-4" />
                      <span className="sr-only">View details for {group.groupname}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDeleteGroup(group)}
                      disabled={isSystem}
                      title={isSystem ? "System groups cannot be deleted" : "Delete group"}
                      className="text-destructive/80 hover:text-destructive hover:bg-destructive/10 disabled:opacity-30"
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Delete group {group.groupname}</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

