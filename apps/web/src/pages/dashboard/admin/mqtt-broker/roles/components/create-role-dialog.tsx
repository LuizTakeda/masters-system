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
import { useRoles } from "@/hooks/mqtt/use-roles";
import { Loader2, Plus, ShieldPlus, Trash2 } from "lucide-react";
import type { HttpErrorType } from "@repo/types/commons";
import type { CreateRoleBodyType } from "@repo/types/endpoints/mqtt/role";

type AclDraft = NonNullable<CreateRoleBodyType["acls"]>[number];

const ACL_TYPES: Array<{ value: AclDraft["acltype"]; label: string }> = [
  { value: "publishClientSend", label: "Publish (Send)" },
  { value: "publishClientReceive", label: "Publish (Receive)" },
  { value: "subscribePattern", label: "Subscribe Pattern" },
  { value: "unsubscribePattern", label: "Unsubscribe Pattern" },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateRoleDialog({ open, onOpenChange }: Props) {
  const { createRole } = useRoles();

  const [rolename, setRolename] = useState("");
  const [textname, setTextname] = useState("");
  const [textdescription, setTextdescription] = useState("");
  const [acls, setAcls] = useState<AclDraft[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setRolename("");
    setTextname("");
    setTextdescription("");
    setAcls([]);
  };

  const handleAddAcl = () => {
    setAcls((prev) => [
      ...prev,
      {
        acltype: "publishClientSend",
        topic: "",
        priority: 0,
        allow: true,
      },
    ]);
  };

  const handleRemoveAcl = (index: number) => {
    setAcls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateAcl = <K extends keyof AclDraft>(
    index: number,
    field: K,
    value: AclDraft[K]
  ) => {
    setAcls((prev) =>
      prev.map((acl, i) => (i === index ? { ...acl, [field]: value } : acl))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = rolename.trim();
    if (!trimmedName) {
      toast.add({
        title: "Validation error",
        description: "Role name is required.",
        type: "error",
      });
      return;
    }

    // Validate ACL topics if any were added
    for (let i = 0; i < acls.length; i++) {
      if (!acls[i]?.topic.trim()) {
        toast.add({
          title: "Validation error",
          description: `ACL rule #${i + 1} requires a valid topic filter.`,
          type: "error",
        });
        return;
      }
    }

    const payload: CreateRoleBodyType = {
      rolename: trimmedName,
      ...(textname.trim() ? { textname: textname.trim() } : {}),
      ...(textdescription.trim() ? { textdescription: textdescription.trim() } : {}),
      ...(acls.length > 0
        ? {
            acls: acls.map((a) => ({
              acltype: a.acltype,
              topic: a.topic.trim(),
              priority: Number(a.priority) || 0,
              allow: Boolean(a.allow),
            })),
          }
        : {}),
    };

    try {
      setIsSubmitting(true);
      const response = await createRole(payload);
      toast.add({
        title: "Role created successfully",
        description: response?.message || `Role "${trimmedName}" has been created.`,
        type: "success",
      });
      resetForm();
      onOpenChange(false);
    } catch (error) {
      const err = error as Partial<HttpErrorType>;
      toast.add({
        title: "Failed to create role",
        description: err.message || "An error occurred while creating the role.",
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
                <ShieldPlus className="size-5" />
              </div>
              <div>
                <DialogTitle>Create New Role</DialogTitle>
                <DialogDescription>
                  Define role details and initial MQTT ACL permissions.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* General Fields */}
          <div className="space-y-3.5 text-sm">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Role Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. telemetry-reader"
                value={rolename}
                onChange={(e) => setRolename(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Display Name <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Input
                  placeholder="e.g. Telemetry Reader"
                  value={textname}
                  onChange={(e) => setTextname(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Description <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Input
                  placeholder="e.g. Reads sensor streams"
                  value={textdescription}
                  onChange={(e) => setTextdescription(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* ACL Rules Section */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  ACL Permissions ({acls.length})
                </h4>
                <p className="text-xs text-muted-foreground">
                  Specify topic filters and access rules.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddAcl}
                disabled={isSubmitting}
                className="gap-1.5 text-xs h-7"
              >
                <Plus className="size-3.5" />
                <span>Add Rule</span>
              </Button>
            </div>

            {acls.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                No ACL rules added yet. Click &quot;Add Rule&quot; to configure topic access.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {acls.map((acl, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border bg-muted/20 p-3 space-y-2 text-xs relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        Rule #{idx + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleRemoveAcl(idx)}
                        disabled={isSubmitting}
                        className="text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                        title="Remove rule"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Type</label>
                        <select
                          value={acl.acltype}
                          onChange={(e) =>
                            handleUpdateAcl(
                              idx,
                              "acltype",
                              e.target.value as AclDraft["acltype"]
                            )
                          }
                          disabled={isSubmitting}
                          className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-2"
                        >
                          {ACL_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Permission</label>
                        <div className="grid grid-cols-2 gap-1 h-8">
                          <button
                            type="button"
                            onClick={() => handleUpdateAcl(idx, "allow", true)}
                            disabled={isSubmitting}
                            className={`rounded-md text-xs font-medium transition-colors border ${
                              acl.allow
                                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                                : "bg-background border-input text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Allow
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateAcl(idx, "allow", false)}
                            disabled={isSubmitting}
                            className={`rounded-md text-xs font-medium transition-colors border ${
                              !acl.allow
                                ? "bg-destructive/15 border-destructive/40 text-destructive"
                                : "bg-background border-input text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Deny
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[11px] text-muted-foreground">
                          Topic Filter <span className="text-destructive">*</span>
                        </label>
                        <Input
                          placeholder="e.g. sensors/# or telemetry/+"
                          value={acl.topic}
                          onChange={(e) => handleUpdateAcl(idx, "topic", e.target.value)}
                          disabled={isSubmitting}
                          required
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Priority</label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={acl.priority}
                          onChange={(e) =>
                            handleUpdateAcl(idx, "priority", Number(e.target.value) || 0)
                          }
                          disabled={isSubmitting}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                  <span>Create Role</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

