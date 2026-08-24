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
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { invalidateClients, useClient } from "@/hooks/mqtt/use-clients";
import { useRoleNames } from "@/hooks/mqtt/use-roles";
import { invalidateGroups, useGroupNames } from "@/hooks/mqtt/use-groups";
import {
  addGroupClient,
  removeGroupClient,
} from "@/services/mqtt/group.service";
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Plus,
  Radio,
  Shield,
  Trash2,
  User,
  UserCheck,
  Users,
  UserX,
  X,
} from "lucide-react";
import type { HttpErrorType } from "@repo/types/commons";
import type {
  GetClientResponseType,
  GetClientsResponseType,
} from "@repo/types/endpoints/mqtt/client";
import { RolePicker } from "./role-picker";
import { GroupPicker } from "./group-picker";

type ClientSummaryItem = GetClientsResponseType["clients"][number];
type ClientDetailItem = GetClientResponseType["client"];

type Props = {
  client: ClientSummaryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ClientDetailsDialog({ client, open, onOpenChange }: Props) {
  const username = client?.username ?? null;
  const {
    client: freshClient,
    enableClient,
    disableClient,
    setPassword,
    addRole,
    removeRole,
  } = useClient(open ? username : null);
  const { roleNames } = useRoleNames();
  const { groupNames } = useGroupNames();

  const activeClient: ClientSummaryItem | ClientDetailItem | null = freshClient ?? client;
  const isDisabled = activeClient && "disabled" in activeClient ? Boolean(activeClient.disabled) : false;

  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Change Password state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Groups state
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);
  const [removingGroupName, setRemovingGroupName] = useState<string | null>(null);

  // Add Role state
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);
  const [removingRoleName, setRemovingRoleName] = useState<string | null>(null);

  const handleToggleStatus = async () => {
    if (!username || !activeClient) return;

    try {
      setIsTogglingStatus(true);
      if (isDisabled) {
        await enableClient();
        toast.add({
          title: "Client enabled",
          description: `Client "${username}" has been enabled.`,
          type: "success",
        });
      } else {
        await disableClient();
        toast.add({
          title: "Client disabled",
          description: `Client "${username}" has been disabled.`,
          type: "success",
        });
      }
    } catch (error) {
      const err = error as Partial<HttpErrorType>;
      toast.add({
        title: "Action failed",
        description: err.message || "Failed to update client status.",
        type: "error",
      });
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      toast.add({
        title: "Validation error",
        description: "New password cannot be empty.",
        type: "error",
      });
      return;
    }

    try {
      setIsSubmittingPassword(true);
      await setPassword({ password: newPassword.trim() });
      toast.add({
        title: "Password updated",
        description: `Password for "${username}" was updated successfully.`,
        type: "success",
      });
      setNewPassword("");
      setShowNewPassword(false);
      setIsChangingPassword(false);
    } catch (error) {
      const err = error as Partial<HttpErrorType>;
      toast.add({
        title: "Failed to update password",
        description: err.message || "Could not change the password.",
        type: "error",
      });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleAddClientToGroup = async (groupName: string) => {
    if (!username) return;
    try {
      setIsSubmittingGroup(true);
      await addGroupClient(groupName, { username });
      await Promise.all([invalidateClients(), invalidateGroups()]);
      toast.add({
        title: "Added to group",
        description: `Client "${username}" was added to group "${groupName}".`,
        type: "success",
      });
      setIsAddingGroup(false);
    } catch (error) {
      const err = error as Partial<HttpErrorType>;
      toast.add({
        title: "Failed to add to group",
        description: err.message || "Could not add client to group.",
        type: "error",
      });
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  const handleRemoveClientFromGroup = async (groupName: string) => {
    if (!username) return;
    try {
      setRemovingGroupName(groupName);
      await removeGroupClient(groupName, { username });
      await Promise.all([invalidateClients(), invalidateGroups()]);
      toast.add({
        title: "Removed from group",
        description: `Client "${username}" was removed from group "${groupName}".`,
        type: "success",
      });
    } catch (error) {
      const err = error as Partial<HttpErrorType>;
      toast.add({
        title: "Failed to remove from group",
        description: err.message || "Could not remove client from group.",
        type: "error",
      });
    } finally {
      setRemovingGroupName(null);
    }
  };

  const handleAddRoleToClient = async (roleName: string) => {
    try {
      setIsSubmittingRole(true);
      await addRole({ rolename: roleName });
      toast.add({
        title: "Role assigned",
        description: `Role "${roleName}" was assigned to ${username}.`,
        type: "success",
      });
      setIsAddingRole(false);
    } catch (error) {
      const err = error as Partial<HttpErrorType>;
      toast.add({
        title: "Failed to assign role",
        description: err.message || "Could not add role to client.",
        type: "error",
      });
    } finally {
      setIsSubmittingRole(false);
    }
  };

  const handleRemoveRoleFromClient = async (roleName: string) => {
    try {
      setRemovingRoleName(roleName);
      await removeRole({ rolename: roleName });
      toast.add({
        title: "Role removed",
        description: `Role "${roleName}" was removed from ${username}.`,
        type: "success",
      });
    } catch (error) {
      const err = error as Partial<HttpErrorType>;
      toast.add({
        title: "Failed to remove role",
        description: err.message || "Could not remove role from client.",
        type: "error",
      });
    } finally {
      setRemovingRoleName(null);
    }
  };

  // Filter assigned groups & roles
  const assignedGroupNames = activeClient?.groups?.map((g) => g.groupname) ?? [];
  const hasUnassignedGroups = (groupNames?.length ?? 0) > assignedGroupNames.length;

  const assignedRoleNames = activeClient?.roles?.map((r) => r.rolename) ?? [];
  const hasUnassignedRoles = (roleNames?.length ?? 0) > assignedRoleNames.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl max-h-[90vh] overflow-y-auto">
        {activeClient && (
          <div className="space-y-5">
            <DialogHeader>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <User className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <DialogTitle className="truncate">{activeClient.username}</DialogTitle>
                    <DialogDescription className="truncate">
                      {activeClient.textdescription || activeClient.textname || "No description provided."}
                    </DialogDescription>
                  </div>
                </div>

                <Button
                  type="button"
                  variant={isDisabled ? "outline" : "secondary"}
                  size="sm"
                  onClick={handleToggleStatus}
                  disabled={isTogglingStatus}
                  className="gap-1.5 text-xs shrink-0"
                >
                  {isTogglingStatus ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : isDisabled ? (
                    <>
                      <UserCheck className="size-3.5 text-emerald-500" />
                      <span>Enable</span>
                    </>
                  ) : (
                    <>
                      <UserX className="size-3.5 text-amber-500" />
                      <span>Disable</span>
                    </>
                  )}
                </Button>
              </div>
            </DialogHeader>

            {/* General Info Card */}
            <div className="rounded-lg border p-3.5 bg-muted/20 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Client ID:</span>
                <span className="font-mono text-foreground">{activeClient.clientid || "Not configured"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Account Status:</span>
                <span
                  className={`font-semibold ${
                    isDisabled ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {isDisabled ? "Disabled" : "Active / Enabled"}
                </span>
              </div>
            </div>

            {/* Active Connections */}
            <div className="space-y-2 text-xs">
              <h4 className="font-semibold uppercase tracking-wider text-muted-foreground text-[11px]">
                Active Connections ({activeClient.connections?.length ?? 0})
              </h4>
              {!activeClient.connections || activeClient.connections.length === 0 ? (
                <div className="rounded-md border border-dashed p-3 text-center text-muted-foreground flex items-center justify-center gap-1.5">
                  <Radio className="size-3.5 opacity-50" />
                  <span>No active MQTT connections.</span>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                  {activeClient.connections.map((conn, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-md border bg-background font-mono text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{conn.address}</span>
                      </div>
                      <span className="text-muted-foreground text-[10px]">Connected</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assigned Groups Section */}
            <div className="space-y-2.5 pt-2 border-t text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold uppercase tracking-wider text-muted-foreground text-[11px]">
                  Assigned Groups ({activeClient.groups?.length ?? 0})
                </h4>
                {!isAddingGroup && hasUnassignedGroups && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingGroup(true)}
                    className="h-6 text-xs gap-1"
                  >
                    <Plus className="size-3" />
                    <span>Add to Group</span>
                  </Button>
                )}
              </div>

              {/* Inline Group Picker */}
              {isAddingGroup && (
                <div className="p-3 rounded-lg border bg-muted/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-[11px]">Search & Add to Group</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => setIsAddingGroup(false)}
                      disabled={isSubmittingGroup}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>

                  <GroupPicker
                    selectedGroups={assignedGroupNames}
                    onSelectGroup={handleAddClientToGroup}
                    mode="single"
                    placeholder="Search group..."
                    disabled={isSubmittingGroup}
                  />
                </div>
              )}

              {/* Groups List */}
              {!activeClient.groups || activeClient.groups.length === 0 ? (
                <div className="rounded-md border border-dashed p-3 text-center text-muted-foreground">
                  Client does not belong to any groups.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {activeClient.groups.map((g) => (
                    <div
                      key={g.groupname}
                      className="flex items-center justify-between p-2 rounded-md border bg-background"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="size-3.5 text-primary shrink-0" />
                        <span className="font-medium text-foreground">{g.groupname}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleRemoveClientFromGroup(g.groupname)}
                        disabled={removingGroupName === g.groupname}
                        className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                        title="Remove from group"
                      >
                        {removingGroupName === g.groupname ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assigned Roles Section */}
            <div className="space-y-2.5 pt-2 border-t text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold uppercase tracking-wider text-muted-foreground text-[11px]">
                  Direct Roles ({activeClient.roles?.length ?? 0})
                </h4>
                {!isAddingRole && hasUnassignedRoles && (
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
                    onSelectRole={handleAddRoleToClient}
                    mode="single"
                    placeholder="Search unassigned role..."
                    disabled={isSubmittingRole}
                  />
                </div>
              )}

              {/* Roles List */}
              {!activeClient.roles || activeClient.roles.length === 0 ? (
                <div className="rounded-md border border-dashed p-3 text-center text-muted-foreground">
                  No direct roles assigned to this client.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {activeClient.roles.map((r) => (
                    <div
                      key={r.rolename}
                      className="flex items-center justify-between p-2 rounded-md border bg-background"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="size-3.5 text-primary shrink-0" />
                        <span className="font-medium text-foreground">{r.rolename}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleRemoveRoleFromClient(r.rolename)}
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
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Password Section */}
            <div className="space-y-2 pt-2 border-t text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold uppercase tracking-wider text-muted-foreground text-[11px]">
                  Credentials
                </h4>
                {!isChangingPassword && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsChangingPassword(true)}
                    className="h-6 text-xs gap-1"
                  >
                    <KeyRound className="size-3" />
                    <span>Change Password</span>
                  </Button>
                )}
              </div>

              {isChangingPassword && (
                <form
                  onSubmit={handleSavePassword}
                  className="flex items-center gap-2 p-2.5 rounded-md border bg-muted/30"
                >
                  <div className="relative flex-1">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isSubmittingPassword}
                      required
                      className="h-7 text-xs pr-7"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      disabled={isSubmittingPassword}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                      title={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? (
                        <EyeOff className="size-3.5" />
                      ) : (
                        <Eye className="size-3.5" />
                      )}
                      <span className="sr-only">
                        {showNewPassword ? "Hide password" : "Show password"}
                      </span>
                    </button>
                  </div>

                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmittingPassword}
                    className="h-7 text-xs gap-1"
                  >
                    {isSubmittingPassword ? <Loader2 className="size-3 animate-spin" /> : <span>Update</span>}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setNewPassword("");
                      setShowNewPassword(false);
                    }}
                    disabled={isSubmittingPassword}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                </form>
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
