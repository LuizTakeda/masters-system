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
import { useClients } from "@/hooks/mqtt/use-clients";
import { Eye, EyeOff, Loader2, Plus, UserPlus } from "lucide-react";
import type { HttpErrorType } from "@repo/types/commons";
import type { CreateClientBodyType } from "@repo/types/endpoints/mqtt/client";
import { RolePicker } from "./role-picker";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateClientDialog({ open, onOpenChange }: Props) {
  const { createClient } = useClients();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [clientid, setClientid] = useState("");
  const [textname, setTextname] = useState("");
  const [textdescription, setTextdescription] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setShowPassword(false);
    setClientid("");
    setTextname("");
    setTextdescription("");
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

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      toast.add({
        title: "Validation error",
        description: "Username and password are required.",
        type: "error",
      });
      return;
    }

    const payload: CreateClientBodyType = {
      username: trimmedUsername,
      password: trimmedPassword,
      ...(clientid.trim() ? { clientid: clientid.trim() } : {}),
      ...(textname.trim() ? { textname: textname.trim() } : {}),
      ...(textdescription.trim() ? { textdescription: textdescription.trim() } : {}),
      ...(selectedRoles.length > 0
        ? {
            roles: selectedRoles.map((r) => ({ rolename: r })),
          }
        : {}),
    };

    try {
      setIsSubmitting(true);
      const response = await createClient(payload);
      toast.add({
        title: "Client created successfully",
        description: response?.message || `Client "${trimmedUsername}" has been created.`,
        type: "success",
      });
      resetForm();
      onOpenChange(false);
    } catch (error) {
      const err = error as Partial<HttpErrorType>;
      toast.add({
        title: "Failed to create client",
        description: err.message || "An error occurred while creating the client.",
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
                <UserPlus className="size-5" />
              </div>
              <div>
                <DialogTitle>Create New Client</DialogTitle>
                <DialogDescription>
                  Configure credentials and initial security roles for MQTT authentication.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Credentials */}
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Username <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g. sensor-node-01"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Password <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Client password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="pr-8.5"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={isSubmitting}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Client ID <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Input
                  placeholder="e.g. client-uuid-1234"
                  value={clientid}
                  onChange={(e) => setClientid(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Display Name <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Input
                  placeholder="e.g. Sensor Node 01"
                  value={textname}
                  onChange={(e) => setTextname(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Description <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                placeholder="e.g. Temperature sensor in Warehouse A"
                value={textdescription}
                onChange={(e) => setTextdescription(e.target.value)}
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
                  <span>Create Client</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
