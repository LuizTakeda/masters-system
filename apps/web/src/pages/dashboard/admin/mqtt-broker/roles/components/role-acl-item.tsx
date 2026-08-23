import type { GetRolesResponseType } from "@repo/types/endpoints/mqtt/role";

type RoleAcl = NonNullable<GetRolesResponseType["roles"][number]["acls"]>[number];

type Props = {
  acl: RoleAcl;
};

export function RoleAclItem({ acl }: Props) {
  return (
    <div className="rounded-md border p-3 space-y-1 bg-background text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground">{acl.acltype}</span>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
            acl.allow
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {acl.allow ? "Permitir" : "Negar"}
        </span>
      </div>
      <div className="text-muted-foreground font-mono">
        Tópico: <span className="text-foreground">{acl.topic}</span>
      </div>
      <div className="text-muted-foreground">
        Prioridade: <span className="text-foreground">{acl.priority}</span>
      </div>
    </div>
  );
}

