import { useMemo, useState } from "react";
import { useRoleNames } from "@/hooks/mqtt/use-roles";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Plus, Search, Shield, X } from "lucide-react";

type Props = {
  /** The currently selected or assigned role names */
  selectedRoles?: string[];
  /** Callback fired when a role's selection is toggled (in multiple mode) */
  onToggleRole?: (roleName: string) => void;
  /** Callback fired when a role is chosen/assigned (in single mode) */
  onSelectRole?: (roleName: string) => void;
  /** Mode: "multiple" for toggle tags, "single" for choosing an unassigned role */
  mode?: "multiple" | "single";
  placeholder?: string;
  disabled?: boolean;
};

export function RolePicker({
  selectedRoles = [],
  onToggleRole,
  onSelectRole,
  mode = "multiple",
  placeholder = "Search roles...",
  disabled = false,
}: Props) {
  const { roleNames, isLoading, isError } = useRoleNames();
  const [searchQuery, setSearchQuery] = useState("");

  const assignedSet = useMemo(() => new Set(selectedRoles), [selectedRoles]);

  const filteredRoles = useMemo(() => {
    if (!roleNames) return [];
    const query = searchQuery.trim().toLowerCase();

    let list = roleNames;
    if (mode === "single") {
      list = list.filter((name) => !assignedSet.has(name));
    }

    if (!query) return list;
    return list.filter((name) => name.toLowerCase().includes(query));
  }, [roleNames, searchQuery, mode, assignedSet]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full rounded-lg" />
        <div className="flex flex-wrap gap-1.5">
          <Skeleton className="h-6 w-20 rounded-md" />
          <Skeleton className="h-6 w-24 rounded-md" />
          <Skeleton className="h-6 w-16 rounded-md" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
        Failed to load roles from broker.
      </div>
    );
  }

  if (!roleNames || roleNames.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
        No roles found on the broker.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={disabled}
          className="h-8 pl-8 text-xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
            <span className="sr-only">Clear search</span>
          </button>
        )}
      </div>

      <div className="max-h-36 overflow-y-auto pr-1">
        {filteredRoles.length === 0 ? (
          <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
            {mode === "single" && roleNames.length === assignedSet.size
              ? "All available roles are already assigned."
              : `No roles matching "${searchQuery}".`}
          </div>
        ) : mode === "multiple" ? (
          <div className="flex flex-wrap gap-1.5 p-1.5 border rounded-lg bg-muted/20">
            {filteredRoles.map((name) => {
              const isSelected = assignedSet.has(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onToggleRole?.(name)}
                  disabled={disabled}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-background text-muted-foreground border-input hover:text-foreground hover:border-foreground/30"
                  }`}
                >
                  <Shield className="size-3 shrink-0" />
                  <span>{name}</span>
                  {isSelected ? (
                    <Check className="size-3 shrink-0" />
                  ) : (
                    <Plus className="size-3 shrink-0 opacity-60" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredRoles.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  onSelectRole?.(name);
                  setSearchQuery("");
                }}
                disabled={disabled}
                className="w-full flex items-center justify-between p-2 rounded-md border bg-background hover:bg-muted/50 text-xs text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Shield className="size-3.5 text-primary shrink-0" />
                  <span className="font-medium text-foreground">{name}</span>
                </div>
                <span className="text-[11px] font-medium text-primary flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  <Plus className="size-3" />
                  <span>Assign</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

