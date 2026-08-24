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
import { Info, Radio, Trash2, UserCheck, UserX } from "lucide-react";
import type { GetClientsResponseType } from "@repo/types/endpoints/mqtt/client";

type ClientItem = GetClientsResponseType["clients"][number];

type Props = {
  clients?: ClientItem[];
  isLoading: boolean;
  isError: unknown;
  onSelectClient: (client: ClientItem) => void;
  onDeleteClient: (client: ClientItem) => void;
};

export function ClientsTable({
  clients,
  isLoading,
  isError,
  onSelectClient,
  onDeleteClient,
}: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-1/5">Username</TableHead>
          <TableHead className="w-1/5">Client ID / Name</TableHead>
          <TableHead className="max-w-[180px]">Groups</TableHead>
          <TableHead className="max-w-[180px]">Roles</TableHead>
          <TableHead className="w-24 text-center">Session</TableHead>
          <TableHead className="w-20 text-right">Actions</TableHead>
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
                <Skeleton className="h-5 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-28" />
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
            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
              Failed to load clients.
            </TableCell>
          </TableRow>
        ) : !clients || clients.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
              No clients found.
            </TableCell>
          </TableRow>
        ) : (
          clients.map((client) => {
            const isDisabled = Boolean(client.disabled);
            const hasConnections = (client.connections?.length ?? 0) > 0;

            return (
              <TableRow key={client.username} className="hover:bg-muted/40 transition-colors">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-1.5 rounded-md shrink-0 flex items-center justify-center ${
                        isDisabled
                          ? "bg-destructive/10 text-destructive border border-destructive/20"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      }`}
                      title={isDisabled ? "Client is disabled" : "Client is active/enabled"}
                    >
                      {isDisabled ? (
                        <UserX className="size-4" />
                      ) : (
                        <UserCheck className="size-4" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span
                        className={`font-semibold truncate leading-tight ${
                          isDisabled ? "text-muted-foreground line-through decoration-destructive/50" : "text-foreground"
                        }`}
                      >
                        {client.username}
                      </span>
                      {isDisabled && (
                        <span className="text-[10px] text-destructive font-medium tracking-tight">
                          Disabled
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="text-sm">
                  {client.clientid ? (
                    <span className="font-mono text-xs text-foreground">{client.clientid}</span>
                  ) : client.textname ? (
                    <span className="text-muted-foreground">{client.textname}</span>
                  ) : (
                    <span className="italic text-muted-foreground/50 text-xs">Unspecified</span>
                  )}
                </TableCell>

                <TableCell className="max-w-[180px]">
                  {client.groups && client.groups.length > 0 ? (
                    <div className="flex flex-wrap gap-1 max-h-14 max-w-[180px] overflow-y-auto pr-1">
                      {client.groups.map((g) => (
                        <span
                          key={g.groupname}
                          className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-secondary text-secondary-foreground border shrink-0 whitespace-nowrap"
                        >
                          {g.groupname}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="italic text-muted-foreground/50 text-xs">No groups</span>
                  )}
                </TableCell>

                <TableCell className="max-w-[180px]">
                  {client.roles && client.roles.length > 0 ? (
                    <div className="flex flex-wrap gap-1 max-h-14 max-w-[180px] overflow-y-auto pr-1">
                      {client.roles.map((r) => (
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
                  {hasConnections ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Online ({client.connections?.length})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground">
                      <Radio className="size-3 opacity-50" />
                      Offline
                    </span>
                  )}
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onSelectClient(client)}
                      title="View details"
                    >
                      <Info className="size-4" />
                      <span className="sr-only">View details for {client.username}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDeleteClient(client)}
                      title="Delete client"
                      className="text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Delete client {client.username}</span>
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
