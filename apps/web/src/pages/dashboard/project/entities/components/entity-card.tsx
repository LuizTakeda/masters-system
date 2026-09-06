import { useState, useMemo } from "react";
import type { NgsiLdEntityType } from "@repo/types/endpoints/ngsi-ld/entities.endpoints";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  Link2,
  MapPin,
  Trash2,
  Tag,
} from "lucide-react";

type Props = {
  entity: NgsiLdEntityType;
  onSelect: (entity: NgsiLdEntityType) => void;
  onDelete: (entity: NgsiLdEntityType) => void;
};

// UN/CEFACT common unit codes mapping
const UNIT_CODES: Record<string, string> = {
  CEL: "°C",
  FAH: "°F",
  KEL: "K",
  P1: "%",
  AMP: "A",
  VLT: "V",
  WTT: "W",
  KWT: "kW",
  KWH: "kWh",
  BAR: "bar",
  PAL: "Pa",
  HPR: "hPa",
  MTR: "m",
  CMT: "cm",
  KMT: "km",
  SEC: "s",
  MIN: "min",
  HUR: "h",
  DAY: "d",
  LBR: "lux",
  LUX: "lux",
  PPM: "ppm",
};

export interface ParsedAttribute {
  name: string;
  rawName?: string;
  kind: "Property" | "Relationship" | "GeoProperty" | "Primitive";
  value: unknown;
  unit?: string;
  observedAt?: string;
  targetObject?: string;
}

const RESERVED_KEYS = new Set([
  "id",
  "type",
  "@context",
  "scope",
  "location",
  "observationSpace",
  "operationSpace",
  "createdAt",
  "modifiedAt",
  "deletedAt",
]);

/**
 * Extracts the clean attribute name from a potential URI or URN.
 * Takes the segment after the last '/', and strips any '#' anchor if present.
 */
function extractAttributeShortName(key: string): string {
  const afterSlash = key.includes("/") ? key.split("/").pop() || key : key;
  return afterSlash.includes("#")
    ? afterSlash.split("#").pop() || afterSlash
    : afterSlash;
}

export function parseEntityAttributes(
  entity: NgsiLdEntityType,
): ParsedAttribute[] {
  const attributes: ParsedAttribute[] = [];

  for (const [key, val] of Object.entries(entity)) {
    if (RESERVED_KEYS.has(key)) continue;

    const displayName = extractAttributeShortName(key);

    if (val && typeof val === "object") {
      const record = val as Record<string, unknown>;
      const typeStr = String(record.type || "");

      if (typeStr === "Property" || "value" in record) {
        const rawUnit =
          typeof record.unitCode === "string" ? record.unitCode : undefined;
        const unit = rawUnit
          ? UNIT_CODES[rawUnit.toUpperCase()] || rawUnit
          : undefined;
        attributes.push({
          rawName: key,
          name: displayName,
          kind: "Property",
          value: record.value,
          unit,
          observedAt:
            typeof record.observedAt === "string"
              ? record.observedAt
              : undefined,
        });
      } else if (typeStr === "Relationship" || "object" in record) {
        attributes.push({
          rawName: key,
          name: displayName,
          kind: "Relationship",
          value: record.object,
          targetObject:
            typeof record.object === "string" ? record.object : undefined,
          observedAt:
            typeof record.observedAt === "string"
              ? record.observedAt
              : undefined,
        });
      } else if (typeStr === "GeoProperty") {
        attributes.push({
          rawName: key,
          name: displayName,
          kind: "GeoProperty",
          value: record.value,
          observedAt:
            typeof record.observedAt === "string"
              ? record.observedAt
              : undefined,
        });
      } else {
        attributes.push({
          rawName: key,
          name: displayName,
          kind: "Primitive",
          value: val,
        });
      }
    } else {
      attributes.push({
        rawName: key,
        name: displayName,
        kind: "Primitive",
        value: val,
      });
    }
  }

  return attributes;
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return "Just now";
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    if (diffMs < 0 || isNaN(diffMs)) return dateStr;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 10) return "Just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d ago`;
  } catch {
    return dateStr;
  }
}

export function EntityCard({ entity, onSelect, onDelete }: Props) {
  const [isCopied, setIsCopied] = useState(false);

  const attributes = useMemo(() => parseEntityAttributes(entity), [entity]);

  const typeDisplay = Array.isArray(entity.type)
    ? entity.type.join(", ")
    : entity.type || "Entity";

  // Friendly short identifier
  const shortId = entity.id.includes(":")
    ? entity.id.split(":").slice(-2).join(":")
    : entity.id;

  const handleCopyId = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(entity.id);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  // Find latest timestamp among modifiedAt, createdAt or attributes observedAt
  const latestTimestamp = useMemo(() => {
    let latest = entity.modifiedAt || entity.createdAt;
    for (const attr of attributes) {
      if (attr.observedAt) {
        if (!latest || new Date(attr.observedAt) > new Date(latest)) {
          latest = attr.observedAt;
        }
      }
    }
    return latest;
  }, [entity, attributes]);

  // Preview up to 4 attributes in the card
  const previewAttrs = attributes.slice(0, 4);
  const remainingCount = attributes.length - previewAttrs.length;

  return (
    <div
      onClick={() => onSelect(entity)}
      className="group relative flex flex-col justify-between rounded-xl border bg-card text-card-foreground shadow-2xs hover:shadow-md hover:border-primary/40 transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Top Header */}
      <div className="p-4 pb-3 border-b bg-muted/15 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Entity Type Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 max-w-[200px] truncate">
            <Tag className="size-3 shrink-0" />
            <span className="truncate">{typeDisplay}</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(entity);
              }}
              className="text-muted-foreground hover:text-foreground"
              title="Inspect details"
            >
              <Eye className="size-3.5" />
              <span className="sr-only">Inspect details</span>
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(entity);
              }}
              className="text-muted-foreground hover:text-destructive"
              title="Delete entity"
            >
              <Trash2 className="size-3.5" />
              <span className="sr-only">Delete entity</span>
            </Button>
          </div>
        </div>

        {/* Entity ID with Copy */}
        <div className="flex items-center justify-between gap-1.5">
          <span
            className="font-mono text-xs font-semibold text-foreground truncate"
            title={entity.id}
          >
            {shortId}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleCopyId}
            className="shrink-0 size-6 text-muted-foreground hover:text-foreground"
            title="Copy full entity URN"
          >
            {isCopied ? (
              <Check className="size-3 text-green-500" />
            ) : (
              <Copy className="size-3" />
            )}
            <span className="sr-only">Copy entity ID</span>
          </Button>
        </div>
      </div>

      {/* Body: Properties Visualizer */}
      <div className="p-4 flex-1 space-y-3">
        {attributes.length === 0 ? (
          <div className="py-6 flex flex-col items-center justify-center text-center text-xs text-muted-foreground">
            <Activity className="size-6 text-muted-foreground/40 mb-1.5" />
            <span>No custom attributes</span>
            <span className="text-[10px] text-muted-foreground/70">
              Attributes will show when telemetry is published
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {previewAttrs.map((attr) => {
              const isBool = typeof attr.value === "boolean";
              const isNumber =
                typeof attr.value === "number" && !isNaN(attr.value);

              return (
                <div
                  key={attr.name}
                  className="p-2 rounded-lg bg-muted/40 border border-border/50 flex flex-col justify-between space-y-1 min-h-[56px] overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="text-[11px] font-medium text-muted-foreground truncate uppercase tracking-wider"
                      title={attr.rawName || attr.name}
                    >
                      {attr.name}
                    </span>
                    {attr.kind === "Relationship" && (
                      <Link2 className="size-2.5 text-primary/70 shrink-0" />
                    )}
                    {attr.kind === "GeoProperty" && (
                      <MapPin className="size-2.5 text-primary/70 shrink-0" />
                    )}
                  </div>

                  <div className="flex items-baseline gap-1 truncate">
                    {isBool ? (
                      <span
                        className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          attr.value
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {attr.value ? "TRUE" : "FALSE"}
                      </span>
                    ) : isNumber ? (
                      <>
                        <span className="font-mono text-sm font-bold text-foreground">
                          {Number.isInteger(attr.value as number)
                            ? (attr.value as number)
                            : (attr.value as number).toFixed(2)}
                        </span>
                        {attr.unit && (
                          <span className="text-[10px] font-semibold text-muted-foreground">
                            {attr.unit}
                          </span>
                        )}
                      </>
                    ) : attr.kind === "Relationship" ? (
                      <span
                        className="font-mono text-[11px] text-primary truncate hover:underline"
                        title={String(attr.value)}
                      >
                        {String(attr.value).split(":").pop() ||
                          String(attr.value)}
                      </span>
                    ) : (
                      <span
                        className="text-xs font-medium text-foreground truncate"
                        title={String(attr.value)}
                      >
                        {String(attr.value)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* More attributes indicator */}
        {remainingCount > 0 && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-muted-foreground">
              +{remainingCount} more{" "}
              {remainingCount === 1 ? "attribute" : "attributes"}
            </span>
            <span className="text-[11px] font-semibold text-primary inline-flex items-center gap-1 group-hover:underline">
              <span>View all</span>
              <ExternalLink className="size-2.5" />
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t bg-muted/10 flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5 truncate">
          <Clock className="size-3 text-muted-foreground shrink-0" />
          <span className="truncate">
            {latestTimestamp
              ? formatRelativeTime(latestTimestamp)
              : "No timestamp"}
          </span>
        </div>
      </div>
    </div>
  );
}
