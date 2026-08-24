import type { GetRolesResponseType } from "@repo/types/endpoints/mqtt/role";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

type RoleAcl = NonNullable<GetRolesResponseType["roles"][number]["acls"]>[number];

type Props = {
  acl: RoleAcl;
  onRemove?: (acl: RoleAcl) => void;
  disabled?: boolean;
};

export function RoleAclItem({ acl, onRemove, disabled }: Props) {
  return (
    <div className="rounded-md border p-3 space-y-1.5 bg-background text-xs relative group">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground">{acl.acltype}</span>
        <div className="flex items-center gap-1.5">
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
              acl.allow
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {acl.allow ? "Allow" : "Deny"}
          </span>
          {onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => onRemove(acl)}
              disabled={disabled}
              className="text-destructive/70 hover:text-destructive hover:bg-destructive/10"
              title="Remove ACL rule"
            >
              <Trash2 className="size-3.5" />
              <span className="sr-only">Remove ACL rule</span>
            </Button>
          )}
        </div>
      </div>
      <div className="text-muted-foreground font-mono">
        Topic: <span className="text-foreground">{acl.topic}</span>
      </div>
      <div className="text-muted-foreground">
        Priority: <span className="text-foreground">{acl.priority}</span>
      </div>
    </div>
  );
}
