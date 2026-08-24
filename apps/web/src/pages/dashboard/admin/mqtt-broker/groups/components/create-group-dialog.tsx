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
import { useGroups } from "@/hooks/mqtt/use-groups";
import { Loader2, Plus, Users } from "lucide-react";
import type { HttpErrorType } from "@repo/types/commons";
import type { CreateGroupBodyType } from "@repo/types/endpoints/mqtt/group";
import { RolePicker } from "@/pages/dashboard/admin/mqtt-broker/clients/components/role-picker";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateGroupDialog({ open, onOpenChange }: Props) {
  const { createGroup } = useGroups();

  const [groupname, setGroupname] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setGroupname("");
    setSelectedRoles([]);
  };

  const handleToggleRole = (roleName: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleName)
        ? prev.filter((r) => r !== roleName)
        : [...prev, roleName]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedGroupname = groupname.trim();

    if (!trimmedGroupname) {
      toast.add({
        title: "Validation error",
        description: "Group name is required.",
        type: "error",
      });
      return;
    }

    const payload: CreateGroupBodyType = {
      groupname: trimmedGroupname,
      ...(selectedRoles.length > 0
        ? {
            roles: selectedRoles.map((r) => ({ rolename: r })),
          }
        : {}),
    };

    try {
      setIsSubmitting(true);
      const response = await createGroup(payload);
      toast.add({
        title: "Group created successfully",
        description: response?.message || `Group "${trimmedGroupname}" has been created.`,
        type: "success",
      });
      resetForm();
      onOpenChange(false);
    } catch (error) {
      const err = error as Partial<HttpErrorType>;
      toast.add({
        title: "Failed to create group",
        description: err.message || "An error occurred while creating the group.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Users className="size-5" />
              </div>
              <div>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogDescription>
                  Group multiple clients together and associate common security roles.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Group Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. sensors, operators, telemetry"
                value={groupname}
                onChange={(e) => setGroupname(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Roles Selection with RolePicker */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Assigned Roles ({selectedRoles.length})
              </h4>
            </div>

            <RolePicker
              selectedRoles={selectedRoles}
              onToggleRole={handleToggleRole}
              mode="multiple"
              placeholder="Search and select roles..."
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  <span>Create Group</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
