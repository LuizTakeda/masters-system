import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ShieldCheck } from "lucide-react";
import type { GetRolesResponseType } from "@repo/types/endpoints/mqtt/role";
import { RoleAclItem } from "./role-acl-item";

type RoleItem = GetRolesResponseType["roles"][number];

type Props = {
  role: RoleItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RoleDetailsSheet({ role, open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-6 overflow-y-auto">
        {role && (
          <div className="space-y-6">
            <SheetHeader className="p-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                  <ShieldCheck className="size-5" />
                </div>
                <div className="min-w-0">
                  <SheetTitle className="truncate">{role.rolename}</SheetTitle>
                  <SheetDescription className="truncate">
                    {role.textdescription || "No description provided."}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="space-y-4 text-sm">
              <div className="rounded-md border p-3 bg-muted/20 space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  General Settings
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Wildcard Subscriptions:</span>
                  <span className="font-medium">
                    {role.allowwildcardsubs ? "Allowed" : "Disabled / Default"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    ACL Rules ({role.acls?.length ?? 0})
                  </span>
                </div>

                {!role.acls || role.acls.length === 0 ? (
                  <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                    No ACL rules configured for this role.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {role.acls.map((acl, idx) => (
                      <RoleAclItem key={idx} acl={acl} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
