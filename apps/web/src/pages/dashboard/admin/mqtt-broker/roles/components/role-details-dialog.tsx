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
import { useRole } from "@/hooks/mqtt/use-roles";
import { Loader2, Plus, ShieldCheck, X } from "lucide-react";
import type { AddRoleAclBodyType, GetRolesResponseType } from "@repo/types/endpoints/mqtt/role";
import type { HttpErrorType } from "@repo/types/commons";
import { RoleAclItem } from "./role-acl-item";

type RoleItem = GetRolesResponseType["roles"][number];
type RoleAcl = NonNullable<RoleItem["acls"]>[number];

const ACL_TYPES: Array<{ value: AddRoleAclBodyType["acltype"]; label: string }> = [
  { value: "publishClientSend", label: "Publish (Send)" },
  { value: "publishClientReceive", label: "Publish (Receive)" },
  { value: "subscribePattern", label: "Subscribe Pattern" },
  { value: "unsubscribePattern", label: "Unsubscribe Pattern" },
];

type Props = {
  role: RoleItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RoleDetailsDialog({ role, open, onOpenChange }: Props) {
  const roleName = role?.rolename ?? null;
  const { role: freshRole, addAcl, removeAcl } = useRole(open ? roleName : null);

  const activeRole = freshRole ?? role;

  const [isAddingAcl, setIsAddingAcl] = useState(false);
  const [aclType, setAclType] = useState<AddRoleAclBodyType["acltype"]>("publishClientSend");
  const [topic, setTopic] = useState("");
  const [priority, setPriority] = useState(0);
  const [allow, setAllow] = useState(true);
  const [isSubmittingAcl, setIsSubmittingAcl] = useState(false);
  const [removingTopic, setRemovingTopic] = useState<string | null>(null);

  const resetAclForm = () => {
    setAclType("publishClientSend");
    setTopic("");
    setPriority(0);
    setAllow(true);
    setIsAddingAcl(false);
  };

  const handleSaveAcl = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      toast.add({
        title: "Validation error",
        description: "Topic filter is required.",
        type: "error",
      });
      return;
    }

    try {
      setIsSubmittingAcl(true);
      await addAcl({
        acltype: aclType,
        topic: trimmedTopic,
        priority: Number(priority) || 0,
        allow,
      });
      toast.add({
        title: "ACL added",
        description: `ACL rule for topic "${trimmedTopic}" was added successfully.`,
        type: "success",
      });
      resetAclForm();
    } catch (error) {
      const err = error as Partial<HttpErrorType>;
      toast.add({
        title: "Failed to add ACL",
        description: err.message || "An error occurred while adding the ACL rule.",
        type: "error",
      });
    } finally {
      setIsSubmittingAcl(false);
    }
  };

  const handleRemoveAclRule = async (acl: RoleAcl) => {
    try {
      setRemovingTopic(acl.topic);
      await removeAcl({
        acltype: acl.acltype as AddRoleAclBodyType["acltype"],
        topic: acl.topic,
      });
      toast.add({
        title: "ACL removed",
        description: `ACL rule for topic "${acl.topic}" was removed.`,
        type: "success",
      });
    } catch (error) {
      const err = error as Partial<HttpErrorType>;
      toast.add({
        title: "Failed to remove ACL",
        description: err.message || "An error occurred while removing the ACL rule.",
        type: "error",
      });
    } finally {
      setRemovingTopic(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        {activeRole && (
          <div className="space-y-5">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                  <ShieldCheck className="size-5" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="truncate">{activeRole.rolename}</DialogTitle>
                  <DialogDescription className="truncate">
                    {activeRole.textdescription || "No description provided."}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 text-sm">
              <div className="rounded-lg border p-3 bg-muted/20 space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  General Settings
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Wildcard Subscriptions:</span>
                  <span className="font-medium">
                    {activeRole.allowwildcardsubs ? "Allowed" : "Disabled / Default"}
                  </span>
                </div>
              </div>

              {/* ACL Rules Header & Form */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      ACL Rules ({activeRole.acls?.length ?? 0})
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Manage topic permissions for this role.
                    </p>
                  </div>
                  {!isAddingAcl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingAcl(true)}
                      className="gap-1.5 text-xs h-7"
                    >
                      <Plus className="size-3.5" />
                      <span>Add ACL</span>
                    </Button>
                  )}
                </div>

                {/* Inline Add ACL Form */}
                {isAddingAcl && (
                  <form
                    onSubmit={handleSaveAcl}
                    className="rounded-lg border bg-muted/30 p-3.5 space-y-3 text-xs animate-in fade-in-0 duration-150"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">New ACL Rule</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={resetAclForm}
                        disabled={isSubmittingAcl}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Type</label>
                        <select
                          value={aclType}
                          onChange={(e) =>
                            setAclType(e.target.value as AddRoleAclBodyType["acltype"])
                          }
                          disabled={isSubmittingAcl}
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
                            onClick={() => setAllow(true)}
                            disabled={isSubmittingAcl}
                            className={`rounded-md text-xs font-medium transition-colors border ${
                              allow
                                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                                : "bg-background border-input text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Allow
                          </button>
                          <button
                            type="button"
                            onClick={() => setAllow(false)}
                            disabled={isSubmittingAcl}
                            className={`rounded-md text-xs font-medium transition-colors border ${
                              !allow
                                ? "bg-destructive/15 border-destructive/40 text-destructive"
                                : "bg-background border-input text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Deny
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[11px] text-muted-foreground">
                          Topic Filter <span className="text-destructive">*</span>
                        </label>
                        <Input
                          placeholder="e.g. sensors/# or device/+/status"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          disabled={isSubmittingAcl}
                          required
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">Priority</label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={priority}
                          onChange={(e) => setPriority(Number(e.target.value) || 0)}
                          disabled={isSubmittingAcl}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={resetAclForm}
                        disabled={isSubmittingAcl}
                        className="h-7 text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isSubmittingAcl}
                        className="h-7 text-xs gap-1.5"
                      >
                        {isSubmittingAcl ? (
                          <>
                            <Loader2 className="size-3 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <span>Save Rule</span>
                        )}
                      </Button>
                    </div>
                  </form>
                )}

                {/* ACL Rules List */}
                {!activeRole.acls || activeRole.acls.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                    No ACL rules configured for this role.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {activeRole.acls.map((acl, idx) => (
                      <RoleAclItem
                        key={`${acl.acltype}-${acl.topic}-${idx}`}
                        acl={acl}
                        onRemove={handleRemoveAclRule}
                        disabled={removingTopic === acl.topic}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

