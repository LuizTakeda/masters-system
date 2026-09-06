import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Check,
  Code2,
  Copy,
  Database,
  FileCode,
  Layers,
  Link2,
  MapPin,
  Tag,
} from "lucide-react";
import type { NgsiLdEntityType } from "@repo/types/endpoints/ngsi-ld/entities.endpoints";
import { parseEntityAttributes } from "./entity-card";

type Props = {
  entity: NgsiLdEntityType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EntityDetailsDialog({ entity, open, onOpenChange }: Props) {
  const [activeTab, setActiveTab] = useState<"attributes" | "raw" | "context">(
    "attributes",
  );
  const [isCopied, setIsCopied] = useState(false);
  const [isJsonCopied, setIsJsonCopied] = useState(false);

  const attributes = useMemo(
    () => (entity ? parseEntityAttributes(entity) : []),
    [entity],
  );

  if (!entity) return null;

  const typeDisplay = Array.isArray(entity.type)
    ? entity.type.join(", ")
    : entity.type || "Entity";

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(entity.id);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(entity, null, 2));
      setIsJsonCopied(true);
      setTimeout(() => setIsJsonCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 pb-4 border-b bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <Database className="size-5" />
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-base font-bold text-foreground">
                  Entity Inspector
                </DialogTitle>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  <Tag className="size-3" />
                  <span>{typeDisplay}</span>
                </span>
              </div>
              <DialogDescription className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono truncate">
                <span className="truncate">{entity.id}</span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleCopyId}
                  className="size-5 text-muted-foreground hover:text-foreground shrink-0"
                  title="Copy URN"
                >
                  {isCopied ? (
                    <Check className="size-3 text-green-500" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  <span className="sr-only">Copy entity ID</span>
                </Button>
              </DialogDescription>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 pt-3">
            <Button
              variant={activeTab === "attributes" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("attributes")}
              className="h-8 gap-1.5 text-xs"
            >
              <Layers className="size-3.5" />
              <span>Attributes ({attributes.length})</span>
            </Button>
            <Button
              variant={activeTab === "raw" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("raw")}
              className="h-8 gap-1.5 text-xs"
            >
              <Code2 className="size-3.5" />
              <span>Raw JSON-LD</span>
            </Button>
            {entity["@context"] && (
              <Button
                variant={activeTab === "context" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("context")}
                className="h-8 gap-1.5 text-xs"
              >
                <FileCode className="size-3.5" />
                <span>@context</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "attributes" && (
            <div className="space-y-4">
              {/* System Attributes Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-lg bg-muted/30 border text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Entity ID
                  </span>
                  <p
                    className="font-mono text-foreground truncate mt-0.5"
                    title={entity.id}
                  >
                    {entity.id}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Type
                  </span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {typeDisplay}
                  </p>
                </div>
                {entity.createdAt && (
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                      Created At
                    </span>
                    <p className="font-mono text-muted-foreground mt-0.5">
                      {new Date(entity.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {entity.modifiedAt && (
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                      Modified At
                    </span>
                    <p className="font-mono text-muted-foreground mt-0.5">
                      {new Date(entity.modifiedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {entity.location && (
                  <div className="col-span-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold flex items-center gap-1">
                      <MapPin className="size-3 text-primary" />
                      Location (GeoProperty)
                    </span>
                    <p className="font-mono text-xs text-foreground mt-0.5 truncate">
                      {JSON.stringify(entity.location.value)}
                    </p>
                  </div>
                )}
              </div>

              {/* Dynamic Attributes Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Entity Attributes & Telemetry
                </h4>

                {attributes.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground border rounded-lg bg-muted/10">
                    No custom attributes or telemetry observed on this entity.
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground">
                          <tr>
                            <th className="px-3 py-2.5">Attribute</th>
                            <th className="px-3 py-2.5">Type</th>
                            <th className="px-3 py-2.5">Current Value</th>
                            <th className="px-3 py-2.5">Unit</th>
                            <th className="px-3 py-2.5">Observed At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {attributes.map((attr) => (
                            <tr
                              key={attr.name}
                              className="hover:bg-muted/20 transition-colors"
                            >
                              <td
                                className="px-3 py-2.5 font-medium font-mono text-foreground"
                                title={attr.rawName || attr.name}
                              >
                                {attr.name}
                              </td>
                              <td className="px-3 py-2.5">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                                  {attr.kind === "Relationship" && (
                                    <Link2 className="size-2.5 text-primary" />
                                  )}
                                  {attr.kind === "GeoProperty" && (
                                    <MapPin className="size-2.5 text-primary" />
                                  )}
                                  <span>{attr.kind}</span>
                                </span>
                              </td>
                              <td className="px-3 py-2.5 font-mono text-foreground max-w-[200px] truncate">
                                {typeof attr.value === "object"
                                  ? JSON.stringify(attr.value)
                                  : String(attr.value)}
                              </td>
                              <td className="px-3 py-2.5 text-muted-foreground">
                                {attr.unit ? (
                                  <span className="font-semibold text-foreground">
                                    {attr.unit}
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                                {attr.observedAt
                                  ? new Date(attr.observedAt).toLocaleString()
                                  : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "raw" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Normalized NGSI-LD JSON payload from Context Broker
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyJson}
                  className="gap-1.5 text-xs h-7"
                >
                  {isJsonCopied ? (
                    <Check className="size-3.5 text-green-500" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  <span>{isJsonCopied ? "Copied" : "Copy JSON"}</span>
                </Button>
              </div>

              <div className="rounded-lg bg-zinc-950 p-4 font-mono text-xs text-zinc-100 overflow-x-auto border max-h-[500px]">
                <pre>{JSON.stringify(entity, null, 2)}</pre>
              </div>
            </div>
          )}

          {activeTab === "context" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                JSON-LD <code>@context</code> definitions applied to this
                entity:
              </p>
              <div className="rounded-lg bg-zinc-950 p-4 font-mono text-xs text-zinc-100 overflow-x-auto border">
                <pre>{JSON.stringify(entity["@context"], null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
