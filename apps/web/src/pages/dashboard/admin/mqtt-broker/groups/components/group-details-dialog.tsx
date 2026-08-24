import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useGroup } from "@/hooks/mqtt/use-groups";
import { useRoleNames } from "@/hooks/mqtt/use-roles";
import { useClientNames } from "@/hooks/mqtt/use-clients";
import {
  Loader2,
  Plus,
  Shield,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";
import type { HttpErrorType } from "@repo/types/commons";
import type {
  GetGroupResponseType,
  GetGroupsResponseType,
} from "@repo/types/endpoints/mqtt/group";
import { RolePicker } from "@/pages/dashboard/admin/mqtt-broker/clients/components/role-picker";
import { ClientPicker } from "./client-picker";

type GroupSummaryItem = NonNullable<GetGroupsResponseType["groups"]>[number];
type GroupDetailItem = GetGroupResponseType["group"];

type Props = {
  group: GroupSummaryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const SYSTEM_GROUPS = ["admin"];

export function GroupDetailsDialog({ group, open, onOpenChange }: Props) {
  const groupname = group?.groupname ?? null;
  const {
    group: freshGroup,
    addRole,
    removeRole,
    addClient,
    removeClient,
  } = useGroup(open ? groupname : null);

  const { roleNames } = useRoleNames();
  const { clientNames } = useClientNames();

  const activeGroup: GroupSummaryItem | GroupDetailItem | null = freshGroup ?? group;
  const isSystem = groupname ? SYSTEM_GROUPS.includes(groupname) : false;

  // Add Role state
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);
  const [removingRoleName, setRemovingRoleName] = useState<string | null>(null);

  // Add Client state
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isSubmittingClient, setIsSubmittingClient] = useState(false);
  const [removingClientUsername, setRemovingClientUsername] = useState<string | null>(null);

  const handleAddRoleToGroup = async (roleName: string) => {
    try {
      setIsSubmittingRole(true);
      await addRole({ rolename: roleName });
      toast.add({
        title: "Role assigned",
        description: `Role "${roleName}" was assigned to group "${groupname}".`,
        type: "success",
      });
      setIsAddingRole(false);
    } catch (error) {
      const err = error as Partial<HttpErrorType>;
      toast.add({
        title: "Failed to assign role",
        description: err.message || "Could not add role to group.",
        type: "error",
      });
    } finally {
      setIsSubmittingRole(false);
    }
  };

  const handleRemoveRoleFromGroup = async (roleName: string) => {
    try {
      setRemovingRoleName(roleName);
      await removeRole({ rolename: roleName });
      toast.add({
        title: "Role removed",
        description: `Role "${roleName}" was removed from group "${groupname}".`,
        type: "success",
      });
    } catch (error) {
      const err = error as Partial<HttpErrorType>;
      toast.add({
        title: "Failed to remove role",
        description: err.message || "Could not remove role from group.",
        type: "error",
      });
    } finally {
      setRemovingRoleName(null);
    }
  };

  const handleAddClientToGroup = async (username: string) => {
    try {
      setIsSubmittingClient(true);
      await addClient({ username });
      toast.add({
        title: "Client added",
        description: `Client "${username}" was added to group "${groupname}".`,
        type: "success",
      });
      setIsAddingClient(false);
    } catch (error) {
      const err = error as Partial<HttpErrorType>;
      toast.add({
        title: "Failed to add client",
        description: err.message || "Could not add client to group.",
        type: "error",
      });
    } finally {
      setIsSubmittingClient(false);
    }
  };

  const handleRemoveClientFromGroup = async (username: string) => {
    try {
      setRemovingClientUsername(username);
      await removeClient({ username });
      toast.add({
        title: "Client removed",
        description: `Client "${username}" was removed from group "${groupname}".`,
        type: "success",
      });
    } catch (error) {
      const err = error as Partial<HttpErrorType>;
      toast.add({
        title: "Failed to remove client",
        description: err.message || "Could not remove client from group.",
        type: "error",
      });
    } finally {
      setRemovingClientUsername(null);
    }
  };

  // Filter assigned roles & clients
  const assignedRoleNames = activeGroup?.roles?.map((r) => r.rolename) ?? [];
  const hasUnassignedRoles = (roleNames?.length ?? 0) > assignedRoleNames.length;

  const assignedClientUsernames = activeGroup?.clients?.map((c) => c.username) ?? [];
  const hasUnassignedClients = (clientNames?.length ?? 0) > assignedClientUsernames.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl max-h-[90vh] overflow-y-auto">
        {activeGroup && (
          <div className="space-y-5">
            <DialogHeader>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                  <Users className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <DialogTitle className="truncate">{activeGroup.groupname}</DialogTitle>
                    {isSystem && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        System Group
                      </span>
                    )}
                  </div>
                  <DialogDescription className="truncate">
                    {activeGroup.textdescription || activeGroup.textname || "No description provided."}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Assigned Roles Section */}
            <div className="space-y-2.5 pt-2 border-t text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold uppercase tracking-wider text-muted-foreground text-[11px]">
                  Assigned Roles ({activeGroup.roles?.length ?? 0})
                </h4>
                {!isAddingRole && hasUnassignedRoles && !isSystem && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingRole(true)}
                    className="h-6 text-xs gap-1"
                  >
                    <Plus className="size-3" />
                    <span>Assign Role</span>
                  </Button>
                )}
              </div>

              {/* Inline Role Picker with Search */}
              {isAddingRole && (
                <div className="p-3 rounded-lg border bg-muted/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-[11px]">Search & Assign Role</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setIsAddingRole(false)}
                      disabled={isSubmittingRole}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>

                  <RolePicker
                    selectedRoles={assignedRoleNames}
                    onSelectRole={handleAddRoleToGroup}
                    mode="single"
                    placeholder="Search unassigned role..."
                    disabled={isSubmittingRole}
                  />
                </div>
              )}

              {/* Roles List */}
              {!activeGroup.roles || activeGroup.roles.length === 0 ? (
                <div className="rounded-md border border-dashed p-3 text-center text-muted-foreground">
                  No roles assigned to this group.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {activeGroup.roles.map((r) => (
                    <div
                      key={r.rolename}
                      className="flex items-center justify-between p-2 rounded-md border bg-background"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="size-3.5 text-primary shrink-0" />
                        <span className="font-medium text-foreground">{r.rolename}</span>
                      </div>
                      {!isSystem && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleRemoveRoleFromGroup(r.rolename)}
                          disabled={removingRoleName === r.rolename}
                          className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                          title="Remove role"
                        >
                          {removingRoleName === r.rolename ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Member Clients Section */}
            <div className="space-y-2.5 pt-2 border-t text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold uppercase tracking-wider text-muted-foreground text-[11px]">
                  Group Members ({activeGroup.clients?.length ?? 0})
                </h4>
                {!isAddingClient && hasUnassignedClients && !isSystem && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingClient(true)}
                    className="h-6 text-xs gap-1"
                  >
                    <Plus className="size-3" />
                    <span>Add Member</span>
                  </Button>
                )}
              </div>

              {/* Inline Client Picker with Search */}
              {isAddingClient && (
                <div className="p-3 rounded-lg border bg-muted/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-[11px]">Search & Add Client</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setIsAddingClient(false)}
                      disabled={isSubmittingClient}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>

                  <ClientPicker
                    selectedClients={assignedClientUsernames}
                    onSelectClient={handleAddClientToGroup}
                    placeholder="Search client username..."
                    disabled={isSubmittingClient}
                  />
                </div>
              )}

              {/* Clients List */}
              {!activeGroup.clients || activeGroup.clients.length === 0 ? (
                <div className="rounded-md border border-dashed p-3 text-center text-muted-foreground">
                  No clients currently in this group.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {activeGroup.clients.map((c) => (
                    <div
                      key={c.username}
                      className="flex items-center justify-between p-2 rounded-md border bg-background"
                    >
                      <div className="flex items-center gap-2">
                        <User className="size-3.5 text-primary shrink-0" />
                        <span className="font-medium text-foreground">{c.username}</span>
                      </div>
                      {!isSystem && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleRemoveClientFromGroup(c.username)}
                          disabled={removingClientUsername === c.username}
                          className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                          title="Remove client from group"
                        >
                          {removingClientUsername === c.username ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
