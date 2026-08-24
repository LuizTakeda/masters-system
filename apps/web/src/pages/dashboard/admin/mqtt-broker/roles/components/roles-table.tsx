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
import { Info, Shield, Trash2 } from "lucide-react";
import type { GetRolesResponseType } from "@repo/types/endpoints/mqtt/role";

type RoleItem = GetRolesResponseType["roles"][number];

type Props = {
  roles?: RoleItem[];
  isLoading: boolean;
  isError: unknown;
  onSelectRole: (role: RoleItem) => void;
  onDeleteRole: (role: RoleItem) => void;
};

export function RolesTable({
  roles,
  isLoading,
  isError,
  onSelectRole,
  onDeleteRole,
}: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-1/3">Name</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="w-24 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-5 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-48" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-8 w-16 ml-auto rounded-md" />
              </TableCell>
            </TableRow>
          ))
        ) : isError ? (
          <TableRow>
            <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
              Failed to load roles.
            </TableCell>
          </TableRow>
        ) : !roles || roles.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
              No roles found.
            </TableCell>
          </TableRow>
        ) : (
          roles.map((role) => (
            <TableRow key={role.rolename} className="hover:bg-muted/40 transition-colors">
              <TableCell className="font-medium flex items-center gap-2">
                <div className="p-1.5 rounded-md shrink-0 flex items-center justify-center bg-primary/10 text-primary border border-primary/20">
                  <Shield className="size-4" />
                </div>
                <span>{role.rolename}</span>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {role.textdescription || <span className="italic text-muted-foreground/50">No description</span>}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onSelectRole(role)}
                    title="View details"
                  >
                    <Info className="size-4" />
                    <span className="sr-only">View details for {role.rolename}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onDeleteRole(role)}
                    title="Delete role"
                    className="text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Delete role {role.rolename}</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
