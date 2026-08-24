import { useMemo, useState } from "react";
import { useClientNames } from "@/hooks/mqtt/use-clients";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, User, X } from "lucide-react";

type Props = {
  /** The currently selected or assigned usernames */
  selectedClients?: string[];
  /** Callback fired when a client is selected */
  onSelectClient?: (username: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function ClientPicker({
  selectedClients = [],
  onSelectClient,
  placeholder = "Search clients to add...",
  disabled = false,
}: Props) {
  const { clientNames, isLoading, isError } = useClientNames();
  const [searchQuery, setSearchQuery] = useState("");

  const assignedSet = useMemo(() => new Set(selectedClients), [selectedClients]);

  const filteredClients = useMemo(() => {
    if (!clientNames) return [];
    const query = searchQuery.trim().toLowerCase();

    const list = clientNames.filter((name) => !assignedSet.has(name));

    if (!query) return list;
    return list.filter((name) => name.toLowerCase().includes(query));
  }, [clientNames, searchQuery, assignedSet]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={disabled || isLoading}
          className="h-8 pl-8 text-xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="size-3.5" />
            <span className="sr-only">Clear search</span>
          </button>
        )}
      </div>

      <div className="max-h-36 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex flex-wrap gap-1.5 p-1.5 border rounded-lg bg-muted/20">
            <Skeleton className="h-6 w-24 rounded-md" />
            <Skeleton className="h-6 w-28 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>
        ) : isError ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
            Failed to load clients from broker.
          </div>
        ) : !clientNames || clientNames.length === 0 ? (
          <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
            No clients found on the broker.
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
            {clientNames.length === assignedSet.size
              ? "All available clients are already members of this group."
              : `No clients matching "${searchQuery}".`}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredClients.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  onSelectClient?.(name);
                  setSearchQuery("");
                }}
                disabled={disabled}
                className="w-full flex items-center justify-between p-2 rounded-md border bg-background hover:bg-muted/50 text-xs text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <User className="size-3.5 text-primary shrink-0" />
                  <span className="font-medium text-foreground">{name}</span>
                </div>
                <span className="text-[11px] font-medium text-primary flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  <Plus className="size-3" />
                  <span>Add</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

