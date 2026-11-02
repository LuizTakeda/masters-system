import { useState, useMemo } from "react";
import { Link, useParams } from "react-router";
import useSWR from "swr";
import PageHeader from "@/pages/dashboard/components/page-header";
import { getEntity } from "@/services/ngsi-ld/entities.service";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatProjectString } from "@/lib/utils";
import {
  parseEntityAttributes,
  type ParsedAttribute,
} from "@/pages/dashboard/project/entities/components/entity-card";
import {
  Activity,
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Copy,
  Database,
  Layers,
  Link2,
  LineChart,
  MapPin,
  RefreshCw,
  SlidersHorizontal,
  Tag,
  TrendingUp,
} from "lucide-react";

//**************************************************
// Types & Helpers
//**************************************************

type TimeSlicePreset = "15m" | "1h" | "6h" | "24h" | "7d" | "custom";

type TimePropertyOption = "observedAt" | "modifiedAt" | "createdAt";

interface TemporalDataPoint {
  timestamp: string;
  timeMs: number;
  value: number | string | boolean;
  numericValue: number | null;
}

interface AttributeTemporalSeries {
  name: string;
  rawName: string;
  unit?: string;
  points: TemporalDataPoint[];
}

const PRESET_RANGES: Array<{
  id: TimeSlicePreset;
  label: string;
  durationMs?: number;
}> = [
  { id: "15m", label: "15m", durationMs: 15 * 60 * 1000 },
  { id: "1h", label: "1h", durationMs: 60 * 60 * 1000 },
  { id: "6h", label: "6h", durationMs: 6 * 60 * 60 * 1000 },
  { id: "24h", label: "24h", durationMs: 24 * 60 * 60 * 1000 },
  { id: "7d", label: "7d", durationMs: 7 * 24 * 60 * 60 * 1000 },
  { id: "custom", label: "Custom" },
];

const RESERVED_TEMPORAL_KEYS = new Set([
  "id",
  "type",
  "@context",
  "scope",
  "createdAt",
  "modifiedAt",
  "deletedAt",
]);

function extractShortName(key: string): string {
  const afterSlash = key.includes("/") ? key.split("/").pop() || key : key;
  return afterSlash.includes("#")
    ? afterSlash.split("#").pop() || afterSlash
    : afterSlash;
}

function toIsoUtcSeconds(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function toLocalDatetimeInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toNumeric(val: unknown): number | null {
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  if (typeof val === "boolean") return val ? 1 : 0;
  if (typeof val === "string" && val.trim() !== "") {
    const parsed = Number(val);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return null;
}

/**
 * Parses both NGSI-LD "temporalValues" simplified format and normalized temporal format.
 */
function parseTemporalEntity(
  temporalEntity: Record<string, unknown> | null | undefined,
  knownUnits: Map<string, string>,
): AttributeTemporalSeries[] {
  if (!temporalEntity || typeof temporalEntity !== "object") return [];

  const seriesList: AttributeTemporalSeries[] = [];

  for (const [key, rawAttr] of Object.entries(temporalEntity)) {
    if (RESERVED_TEMPORAL_KEYS.has(key)) continue;

    const shortName = extractShortName(key);
    const points: TemporalDataPoint[] = [];
    let unit = knownUnits.get(shortName) || knownUnits.get(key);

    // Case 1: Simplified temporalValues format -> { type: "Property", values: [[val, timestamp], ...] }
    if (
      rawAttr &&
      typeof rawAttr === "object" &&
      !Array.isArray(rawAttr) &&
      "values" in rawAttr &&
      Array.isArray((rawAttr as Record<string, unknown>).values)
    ) {
      const attrObj = rawAttr as Record<string, unknown>;
      if (typeof attrObj.unitCode === "string" && !unit) {
        unit = attrObj.unitCode;
      }
      const valuesArr = attrObj.values as unknown[];

      for (const item of valuesArr) {
        if (Array.isArray(item) && item.length >= 2) {
          const rawVal = item[0];
          const rawTs = String(item[1]);
          const timeMs = Date.parse(rawTs);
          if (!Number.isNaN(timeMs)) {
            points.push({
              timestamp: rawTs,
              timeMs,
              value:
                typeof rawVal === "object"
                  ? JSON.stringify(rawVal)
                  : (rawVal as number | string | boolean),
              numericValue: toNumeric(rawVal),
            });
          }
        }
      }
    }
    // Case 2: Normalized temporal format -> Array of { type: "Property", value, observedAt/modifiedAt/createdAt }
    // or Array of temporalValues objects when multiple datasetIds exist
    else if (Array.isArray(rawAttr)) {
      for (const instance of rawAttr) {
        if (instance && typeof instance === "object") {
          const instObj = instance as Record<string, unknown>;
          if (typeof instObj.unitCode === "string" && !unit) {
            unit = instObj.unitCode;
          }
          if ("values" in instObj && Array.isArray(instObj.values)) {
            for (const item of instObj.values as unknown[]) {
              if (Array.isArray(item) && item.length >= 2) {
                const rawVal = item[0];
                const rawTs = String(item[1]);
                const timeMs = Date.parse(rawTs);
                if (!Number.isNaN(timeMs)) {
                  points.push({
                    timestamp: rawTs,
                    timeMs,
                    value:
                      typeof rawVal === "object"
                        ? JSON.stringify(rawVal)
                        : (rawVal as number | string | boolean),
                    numericValue: toNumeric(rawVal),
                  });
                }
              }
            }
            continue;
          }
          const rawVal =
            "value" in instObj
              ? instObj.value
              : "object" in instObj
                ? instObj.object
                : undefined;
          const rawTs =
            (typeof instObj.observedAt === "string" && instObj.observedAt) ||
            (typeof instObj.modifiedAt === "string" && instObj.modifiedAt) ||
            (typeof instObj.createdAt === "string" && instObj.createdAt);

          if (rawVal !== undefined && rawTs) {
            const timeMs = Date.parse(rawTs);
            if (!Number.isNaN(timeMs)) {
              points.push({
                timestamp: rawTs,
                timeMs,
                value:
                  typeof rawVal === "object"
                    ? JSON.stringify(rawVal)
                    : (rawVal as number | string | boolean),
                numericValue: toNumeric(rawVal),
              });
            }
          }
        }
      }
    }
    // Case 3: Single normalized Property instance object
    else if (rawAttr && typeof rawAttr === "object") {
      const instObj = rawAttr as Record<string, unknown>;
      const rawVal =
        "value" in instObj
          ? instObj.value
          : "object" in instObj
            ? instObj.object
            : undefined;
      const rawTs =
        (typeof instObj.observedAt === "string" && instObj.observedAt) ||
        (typeof instObj.modifiedAt === "string" && instObj.modifiedAt) ||
        (typeof instObj.createdAt === "string" && instObj.createdAt);

      if (rawVal !== undefined && rawTs) {
        const timeMs = Date.parse(rawTs);
        if (!Number.isNaN(timeMs)) {
          points.push({
            timestamp: rawTs,
            timeMs,
            value:
              typeof rawVal === "object"
                ? JSON.stringify(rawVal)
                : (rawVal as number | string | boolean),
            numericValue: toNumeric(rawVal),
          });
        }
      }
    }

    // Sort chronologically ascending
    points.sort((a, b) => a.timeMs - b.timeMs);

    seriesList.push({
      name: shortName,
      rawName: key,
      unit,
      points,
    });
  }

  return seriesList;
}

async function fetchTemporalEntity(params: {
  tenant: string;
  entityId: string;
  timerel: "after" | "between";
  timeAt: string;
  endTimeAt?: string;
  timeproperty: TimePropertyOption;
  lastN?: number;
}): Promise<Record<string, unknown> | null> {
  const searchParams = new URLSearchParams();
  searchParams.set("timerel", params.timerel);
  searchParams.set("timeAt", params.timeAt);
  if (params.timerel === "between" && params.endTimeAt) {
    searchParams.set("endTimeAt", params.endTimeAt);
  }
  searchParams.set("timeproperty", params.timeproperty);
  searchParams.set("options", "temporalValues");
  if (params.lastN && params.lastN > 0) {
    searchParams.set("lastN", String(params.lastN));
  }

  const contextUrl =
    "http://workspace:3000/api/fiware/context-file/context.jsonld";
  const url = `/ngsi-ld/v1/temporal/entities/${encodeURIComponent(params.entityId)}?${searchParams.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "NGSILD-Tenant": params.tenant,
      Link: `<${contextUrl}>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    throw {
      statusCode: response.status,
      error: data?.title || data?.error || "Temporal Query Error",
      message: data?.detail || data?.message || response.statusText,
    };
  }

  return data as Record<string, unknown>;
}

//**************************************************
// Interactive SVG Time-Series Chart Component
//**************************************************

function AttributeTemporalChart({
  series,
  currentAttr,
}: {
  series: AttributeTemporalSeries;
  currentAttr?: ParsedAttribute;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const numericPoints = useMemo(
    () =>
      series.points.filter(
        (p): p is TemporalDataPoint & { numericValue: number } =>
          p.numericValue !== null,
      ),
    [series.points],
  );

  const stats = useMemo(() => {
    if (numericPoints.length === 0) return null;
    const values = numericPoints.map((p) => p.numericValue);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((acc, v) => acc + v, 0);
    const avg = sum / values.length;
    const latest = values[values.length - 1];
    return { min, max, avg, latest };
  }, [numericPoints]);

  const width = 640;
  const height = 210;
  const padLeft = 48;
  const padRight = 18;
  const padTop = 18;
  const padBottom = 30;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const chartGeometry = useMemo(() => {
    if (numericPoints.length === 0 || !stats) return null;

    const minTime = numericPoints[0].timeMs;
    const maxTime = numericPoints[numericPoints.length - 1].timeMs;
    const timeSpan = Math.max(1, maxTime - minTime);

    const rawRange = stats.max - stats.min;
    const padding =
      rawRange === 0 ? Math.max(1, Math.abs(stats.max) * 0.1) : rawRange * 0.1;
    const yMin = stats.min - padding;
    const yMax = stats.max + padding;
    const ySpan = Math.max(1e-6, yMax - yMin);

    const coords = numericPoints.map((pt, idx) => {
      const x =
        numericPoints.length === 1
          ? padLeft + plotWidth / 2
          : padLeft + ((pt.timeMs - minTime) / timeSpan) * plotWidth;
      const y =
        padTop + plotHeight - ((pt.numericValue - yMin) / ySpan) * plotHeight;
      return { x, y, pt, idx };
    });

    const linePath = coords
      .map(
        (c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`,
      )
      .join(" ");

    const firstX = coords[0].x.toFixed(1);
    const lastX = coords[coords.length - 1].x.toFixed(1);
    const baselineY = (padTop + plotHeight).toFixed(1);
    const areaPath = `${linePath} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;

    return {
      coords,
      linePath,
      areaPath,
      yMin,
      yMax,
      yMid: (yMin + yMax) / 2,
      minTime,
      maxTime,
    };
  }, [numericPoints, stats, plotWidth, plotHeight]);

  const unitLabel = series.unit || currentAttr?.unit || "";
  const hoveredCoord =
    hoverIndex !== null && chartGeometry?.coords[hoverIndex]
      ? chartGeometry.coords[hoverIndex]
      : null;

  const formatNum = (n: number) =>
    Number.isInteger(n) ? String(n) : n.toFixed(2);

  const formatTimeLabel = (ms: number) => {
    const d = new Date(ms);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-2xs flex flex-col justify-between overflow-hidden">
      {/* Card Header */}
      <div className="p-4 pb-3 border-b bg-muted/15 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
            <TrendingUp className="size-4" />
          </div>
          <div className="min-w-0">
            <h4
              className="text-sm font-bold text-foreground font-mono truncate"
              title={series.rawName}
            >
              {series.name}
            </h4>
            <p className="text-[11px] text-muted-foreground">
              {series.points.length}{" "}
              {series.points.length === 1 ? "sample" : "samples"} in time slice
            </p>
          </div>
        </div>

        {/* Latest Value Badge */}
        {stats ? (
          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
              Latest
            </span>
            <span className="font-mono text-sm font-bold text-primary">
              {formatNum(stats.latest)}
              {unitLabel ? ` ${unitLabel}` : ""}
            </span>
          </div>
        ) : currentAttr !== undefined ? (
          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
              Current
            </span>
            <span className="font-mono text-sm font-bold text-foreground">
              {String(currentAttr.value)}
              {unitLabel ? ` ${unitLabel}` : ""}
            </span>
          </div>
        ) : null}
      </div>

      {/* Chart Body */}
      <div className="p-4 flex-1 flex flex-col justify-center">
        {series.points.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center border border-dashed rounded-lg bg-muted/10 p-4">
            <LineChart className="size-7 text-muted-foreground/40 mb-1.5" />
            <p className="text-xs font-medium text-foreground">
              No temporal data in selected time slice
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Try expanding the time window or waiting for new entity updates.
            </p>
          </div>
        ) : chartGeometry && stats ? (
          <div className="space-y-3">
            <div className="relative select-none">
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-48 overflow-visible"
                onMouseLeave={() => setHoverIndex(null)}
              >
                <defs>
                  <linearGradient
                    id={`grad-${series.name}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="currentColor"
                      stopOpacity="0.28"
                      className="text-primary"
                    />
                    <stop
                      offset="100%"
                      stopColor="currentColor"
                      stopOpacity="0.0"
                      className="text-primary"
                    />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid Lines & Y-Axis Labels */}
                {[
                  { y: padTop, val: chartGeometry.yMax },
                  { y: padTop + plotHeight / 2, val: chartGeometry.yMid },
                  { y: padTop + plotHeight, val: chartGeometry.yMin },
                ].map((grid, i) => (
                  <g key={i}>
                    <line
                      x1={padLeft}
                      y1={grid.y}
                      x2={width - padRight}
                      y2={grid.y}
                      stroke="currentColor"
                      strokeDasharray="3 3"
                      className="text-border"
                      strokeWidth="1"
                    />
                    <text
                      x={padLeft - 6}
                      y={grid.y + 3}
                      textAnchor="end"
                      className="fill-muted-foreground font-mono text-[10px]"
                    >
                      {formatNum(grid.val)}
                    </text>
                  </g>
                ))}

                {/* X-Axis Timestamps */}
                <text
                  x={padLeft}
                  y={height - 6}
                  textAnchor="start"
                  className="fill-muted-foreground font-mono text-[10px]"
                >
                  {formatTimeLabel(chartGeometry.minTime)}
                </text>
                {chartGeometry.maxTime !== chartGeometry.minTime && (
                  <text
                    x={width - padRight}
                    y={height - 6}
                    textAnchor="end"
                    className="fill-muted-foreground font-mono text-[10px]"
                  >
                    {formatTimeLabel(chartGeometry.maxTime)}
                  </text>
                )}

                {/* Area under curve */}
                {chartGeometry.coords.length > 1 && (
                  <path
                    d={chartGeometry.areaPath}
                    fill={`url(#grad-${series.name})`}
                  />
                )}

                {/* Line path */}
                {chartGeometry.coords.length > 1 && (
                  <path
                    d={chartGeometry.linePath}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  />
                )}

                {/* Hover vertical guide line */}
                {hoveredCoord && (
                  <line
                    x1={hoveredCoord.x}
                    y1={padTop}
                    x2={hoveredCoord.x}
                    y2={padTop + plotHeight}
                    stroke="currentColor"
                    strokeDasharray="2 2"
                    className="text-primary/60"
                    strokeWidth="1"
                  />
                )}

                {/* Data points */}
                {chartGeometry.coords.map((c) => {
                  const isHovered = hoverIndex === c.idx;
                  return (
                    <g key={c.idx}>
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r={
                          isHovered
                            ? 5
                            : chartGeometry.coords.length <= 40
                              ? 3
                              : 2
                        }
                        className={
                          isHovered
                            ? "fill-primary stroke-background stroke-2"
                            : "fill-primary"
                        }
                      />
                      {/* Invisible larger hit target for smooth mouse hover */}
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r={12}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoverIndex(c.idx)}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Floating Tooltip */}
              {hoveredCoord && (
                <div className="mt-1 flex items-center justify-between px-2.5 py-1.5 rounded-md bg-muted/70 border text-xs font-mono">
                  <span className="text-muted-foreground">
                    {new Date(hoveredCoord.pt.timeMs).toLocaleString()}
                  </span>
                  <span className="font-bold text-primary">
                    {formatNum(hoveredCoord.pt.numericValue)}
                    {unitLabel ? ` ${unitLabel}` : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Stats Footer (Min / Avg / Max) */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center text-xs">
              <div className="p-1.5 rounded bg-muted/30">
                <span className="text-[10px] text-muted-foreground uppercase block">
                  Min
                </span>
                <span className="font-mono font-semibold text-foreground">
                  {formatNum(stats.min)}
                  {unitLabel ? ` ${unitLabel}` : ""}
                </span>
              </div>
              <div className="p-1.5 rounded bg-muted/30">
                <span className="text-[10px] text-muted-foreground uppercase block">
                  Avg
                </span>
                <span className="font-mono font-semibold text-foreground">
                  {formatNum(stats.avg)}
                  {unitLabel ? ` ${unitLabel}` : ""}
                </span>
              </div>
              <div className="p-1.5 rounded bg-muted/30">
                <span className="text-[10px] text-muted-foreground uppercase block">
                  Max
                </span>
                <span className="font-mono font-semibold text-foreground">
                  {formatNum(stats.max)}
                  {unitLabel ? ` ${unitLabel}` : ""}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Non-numeric attribute timeline list */
          <div className="max-h-48 overflow-y-auto border rounded-lg divide-y text-xs">
            {series.points
              .slice()
              .reverse()
              .map((pt, i) => (
                <div
                  key={`${pt.timestamp}-${i}`}
                  className="px-3 py-2 flex items-center justify-between gap-2 hover:bg-muted/20"
                >
                  <span className="font-mono font-medium text-foreground truncate">
                    {String(pt.value)}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                    {new Date(pt.timeMs).toLocaleTimeString()}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

//**************************************************
// Main Page Component
//**************************************************

export default function ProjectEntityTelemetryPage() {
  const params = useParams<{
    project: string;
    entityId?: string;
    entitie?: string;
    id?: string;
  }>();

  const project = params.project;
  const entityId = params.entityId || params.entitie || params.id || "";

  // Time Slice State
  const [preset, setPreset] = useState<TimeSlicePreset>("1h");
  const [timeproperty, setTimeproperty] =
    useState<TimePropertyOption>("observedAt");
  const [lastN, setLastN] = useState<number>(100);

  // Custom range state (defaults to last 1 hour)
  const [customStart, setCustomStart] = useState<string>(() =>
    toLocalDatetimeInputValue(new Date(Date.now() - 60 * 60 * 1000)),
  );
  const [customEnd, setCustomEnd] = useState<string>(() =>
    toLocalDatetimeInputValue(new Date()),
  );

  // Reference timestamp for relative presets (updated when preset changes or user clicks Refresh)
  const [referenceNow, setReferenceNow] = useState<number>(() => Date.now());
  const [copiedId, setCopiedId] = useState(false);

  const contextLinkHeader = useMemo(
    () =>
      `<http://workspace:3000/api/fiware/context-file/context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"`,
    [],
  );

  // 1. Fetch Current Entity Attributes from Orion-LD (polls every 5s)
  const {
    data: currentEntity,
    isLoading: isEntityLoading,
    isValidating: isEntityValidating,
    error: entityError,
    mutate: mutateEntity,
  } = useSWR(
    project && entityId ? ["/ngsi-ld/v1/entities", project, entityId] : null,
    () =>
      project && entityId
        ? getEntity({ tenant: project, link: contextLinkHeader }, entityId)
        : null,
    { refreshInterval: 5000 },
  );

  const currentAttributes = useMemo(
    () => (currentEntity ? parseEntityAttributes(currentEntity) : []),
    [currentEntity],
  );

  // Compute temporal query window from selected time slice
  const temporalWindow = useMemo(() => {
    if (preset === "custom") {
      const startDate = customStart
        ? new Date(customStart)
        : new Date(referenceNow - 3600_000);
      const endDate = customEnd ? new Date(customEnd) : new Date(referenceNow);
      return {
        timerel: "between" as const,
        timeAt: toIsoUtcSeconds(startDate),
        endTimeAt: toIsoUtcSeconds(endDate),
      };
    }

    const foundPreset = PRESET_RANGES.find((p) => p.id === preset);
    const durationMs = foundPreset?.durationMs ?? 60 * 60 * 1000;
    const startDate = new Date(referenceNow - durationMs);
    return {
      timerel: "after" as const,
      timeAt: toIsoUtcSeconds(startDate),
      endTimeAt: undefined,
    };
  }, [preset, customStart, customEnd, referenceNow]);

  // 2. Fetch Temporal Entity Evolution from Mintaka / Orion-LD TRoE
  const {
    data: temporalEntity,
    isLoading: isTemporalLoading,
    isValidating: isTemporalValidating,
    error: temporalError,
    mutate: mutateTemporal,
  } = useSWR(
    project && entityId
      ? [
          "/ngsi-ld/v1/temporal/entities",
          project,
          entityId,
          temporalWindow.timerel,
          temporalWindow.timeAt,
          temporalWindow.endTimeAt ?? "",
          timeproperty,
          lastN,
        ]
      : null,
    () =>
      project && entityId
        ? fetchTemporalEntity({
            tenant: project,
            entityId,
            timerel: temporalWindow.timerel,
            timeAt: temporalWindow.timeAt,
            endTimeAt: temporalWindow.endTimeAt,
            timeproperty,
            lastN,
          })
        : null,
    { refreshInterval: 10000 },
  );

  // Build combined list of attributes and their temporal series
  const attributeCharts = useMemo(() => {
    const knownUnits = new Map<string, string>();
    for (const attr of currentAttributes) {
      if (attr.unit) {
        knownUnits.set(attr.name, attr.unit);
        if (attr.rawName) knownUnits.set(attr.rawName, attr.unit);
      }
    }

    const parsedTemporal = parseTemporalEntity(temporalEntity, knownUnits);
    const seriesByName = new Map<string, AttributeTemporalSeries>();
    for (const s of parsedTemporal) {
      seriesByName.set(s.name, s);
    }

    // Ensure every current attribute or temporal series has a chart card
    const allNames = new Set<string>();
    for (const attr of currentAttributes) {
      allNames.add(attr.name);
    }
    for (const s of parsedTemporal) {
      allNames.add(s.name);
    }

    return Array.from(allNames).map((name) => {
      const existingSeries = seriesByName.get(name);
      const currentAttr = currentAttributes.find((a) => a.name === name);
      return {
        series: existingSeries ?? {
          name,
          rawName: currentAttr?.rawName || name,
          unit: currentAttr?.unit,
          points: [],
        },
        currentAttr,
      };
    });
  }, [currentAttributes, temporalEntity]);

  const handleSelectPreset = (newPreset: TimeSlicePreset) => {
    setPreset(newPreset);
    setReferenceNow(Date.now());
  };

  const handleRefreshAll = async () => {
    setReferenceNow(Date.now());
    await Promise.all([mutateEntity(), mutateTemporal()]);
  };

  const handleCopyEntityId = async () => {
    if (!entityId) return;
    await navigator.clipboard.writeText(entityId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (!project) return null;

  const projectTitle = formatProjectString(project);

  // Friendly short name & type extraction
  const shortId = entityId.includes(":")
    ? entityId.split(":").slice(-2).join(":")
    : entityId;

  const entityTypeDisplay = useMemo(() => {
    if (currentEntity?.type) {
      return Array.isArray(currentEntity.type)
        ? currentEntity.type.join(", ")
        : String(currentEntity.type);
    }
    if (temporalEntity?.type) {
      return Array.isArray(temporalEntity.type)
        ? (temporalEntity.type as string[]).join(", ")
        : String(temporalEntity.type);
    }
    // Extract from URN: urn:ngsi-ld:<Type>:<id>
    const parts = entityId.split(":");
    if (parts.length >= 4 && parts[0] === "urn" && parts[1] === "ngsi-ld") {
      return parts[2];
    }
    return "Entity";
  }, [currentEntity, temporalEntity, entityId]);

  return (
    <div>
      <PageHeader
        items={[
          {
            label: projectTitle,
            to: `/dashboard/${encodeURIComponent(project)}`,
          },
          {
            label: "Entities",
            to: `/dashboard/${encodeURIComponent(project)}/entitie`,
          },
          { label: shortId || "Entity Details" },
        ]}
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Top Entity Identity & Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border bg-card text-card-foreground shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
              <Database className="size-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold tracking-tight text-foreground font-mono">
                  {shortId || entityId}
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  <Tag className="size-3" />
                  <span>{entityTypeDisplay}</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground border">
                  {project}
                </span>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span
                    className={`size-1.5 rounded-full bg-emerald-500 ${
                      isEntityValidating || isTemporalValidating
                        ? "animate-ping"
                        : "animate-pulse"
                    }`}
                  />
                  <span>Live (5s)</span>
                </div>
              </div>

              {entityId && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Entity URN:</span>
                  <code className="font-mono text-foreground bg-muted px-1.5 py-0.5 rounded border">
                    {entityId}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyEntityId}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Copy Entity URN"
                  >
                    {copiedId ? (
                      <Check className="size-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Link
              to={`/dashboard/${encodeURIComponent(project)}/entitie`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1.5 text-xs h-8",
              )}
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Entities</span>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefreshAll}
              className="gap-1.5 text-xs h-8"
            >
              <RefreshCw
                className={`size-3.5 ${
                  isEntityValidating || isTemporalValidating
                    ? "animate-spin"
                    : ""
                }`}
              />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Section 1: Current Attributes Snapshot */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              <h3 className="text-sm font-bold tracking-tight text-foreground uppercase">
                Current Entity Attributes (Real-Time State)
              </h3>
            </div>
            {currentEntity?.modifiedAt && (
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                <Clock className="size-3" />
                <span>
                  Updated{" "}
                  {new Date(currentEntity.modifiedAt).toLocaleTimeString()}
                </span>
              </span>
            )}
          </div>

          {isEntityLoading && !currentEntity ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : entityError ? (
            (entityError as { statusCode?: number })?.statusCode === 404 ? (
              <div className="p-5 rounded-xl border bg-amber-500/5 border-amber-500/20 text-xs text-muted-foreground flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground">
                    Entity not found in Context Broker
                  </p>
                  <p className="mt-0.5">
                    Entity <code className="font-mono">{entityId}</code> was not
                    found in Orion-LD for tenant{" "}
                    <code className="font-mono">{project}</code>.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefreshAll}>
                  Retry
                </Button>
              </div>
            ) : (
              <div className="p-5 rounded-xl border bg-destructive/10 border-destructive/20 text-xs text-muted-foreground flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-destructive">
                    {(entityError as { error?: string })?.error ||
                      "Failed to fetch current entity state"}
                  </p>
                  <p className="mt-0.5">
                    {(entityError as { message?: string })?.message ||
                      `Could not retrieve ${entityId} from Orion-LD.`}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefreshAll}>
                  Retry
                </Button>
              </div>
            )
          ) : currentAttributes.length === 0 ? (
            <div className="p-6 rounded-xl border bg-card text-center text-xs text-muted-foreground">
              <Activity className="size-6 mx-auto mb-1.5 text-muted-foreground/50" />
              <p className="font-medium text-foreground">
                No current attributes found for this entity
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {currentAttributes.map((attr) => {
                const isNumber =
                  typeof attr.value === "number" && !Number.isNaN(attr.value);
                const isBool = typeof attr.value === "boolean";

                return (
                  <div
                    key={attr.name}
                    className="p-4 rounded-xl border bg-card text-card-foreground shadow-2xs flex flex-col justify-between space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate font-mono"
                        title={attr.rawName || attr.name}
                      >
                        {attr.name}
                      </span>
                      {attr.kind === "Relationship" && (
                        <Link2 className="size-3.5 text-primary/70 shrink-0" />
                      )}
                      {attr.kind === "GeoProperty" && (
                        <MapPin className="size-3.5 text-primary/70 shrink-0" />
                      )}
                    </div>

                    <div className="flex items-baseline gap-1.5">
                      {isBool ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                            attr.value
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {attr.value ? "TRUE" : "FALSE"}
                        </span>
                      ) : isNumber ? (
                        <>
                          <span className="font-mono text-2xl font-bold text-foreground">
                            {Number.isInteger(attr.value as number)
                              ? (attr.value as number)
                              : (attr.value as number).toFixed(2)}
                          </span>
                          {attr.unit && (
                            <span className="text-xs font-semibold text-primary">
                              {attr.unit}
                            </span>
                          )}
                        </>
                      ) : (
                        <span
                          className="font-mono text-sm font-semibold text-foreground truncate"
                          title={
                            typeof attr.value === "object"
                              ? JSON.stringify(attr.value)
                              : String(attr.value)
                          }
                        >
                          {typeof attr.value === "object"
                            ? JSON.stringify(attr.value)
                            : String(attr.value)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
                      <span>{attr.kind}</span>
                      <span className="font-mono">
                        {attr.observedAt
                          ? new Date(attr.observedAt).toLocaleTimeString()
                          : "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Temporal Time-Slice Controls & Charts */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-xl border bg-card shadow-2xs">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-primary shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Temporal History Slice
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Select the time window to query historical attribute values
                  from the NGSI-LD Temporal API.
                </p>
              </div>
            </div>

            {/* Preset Pills + Options */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center rounded-lg border bg-muted/40 p-1 gap-1">
                {PRESET_RANGES.map((item) => {
                  const isActive = preset === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectPreset(item.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Time Property Selector */}
              <select
                value={timeproperty}
                onChange={(e) =>
                  setTimeproperty(e.target.value as TimePropertyOption)
                }
                className="h-8 rounded-md border bg-background px-2.5 text-xs font-medium text-foreground"
                title="Temporal property used to filter"
              >
                <option value="observedAt">observedAt</option>
                <option value="modifiedAt">modifiedAt</option>
                <option value="createdAt">createdAt</option>
              </select>

              {/* Max samples (lastN) */}
              <select
                value={lastN}
                onChange={(e) => setLastN(Number(e.target.value))}
                className="h-8 rounded-md border bg-background px-2.5 text-xs font-mono text-foreground"
                title="Maximum points per attribute (lastN)"
              >
                <option value={50}>Last 50 pts</option>
                <option value={100}>Last 100 pts</option>
                <option value={250}>Last 250 pts</option>
                <option value={500}>Last 500 pts</option>
              </select>
            </div>
          </div>

          {/* Custom Date/Time Slice Picker */}
          {preset === "custom" && (
            <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl border bg-muted/20 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <Calendar className="size-4 text-primary" />
                <span>Custom Slice:</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-muted-foreground">From:</label>
                <Input
                  type="datetime-local"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="h-8 text-xs font-mono w-auto"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-muted-foreground">To:</label>
                <Input
                  type="datetime-local"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="h-8 text-xs font-mono w-auto"
                />
              </div>
            </div>
          )}

          {/* Active Query Window Summary */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
            <span className="font-mono">
              timerel=<strong>{temporalWindow.timerel}</strong> | timeAt=
              <strong>{temporalWindow.timeAt}</strong>
              {temporalWindow.endTimeAt
                ? ` | endTimeAt=${temporalWindow.endTimeAt}`
                : ""}{" "}
              | timeproperty=<strong>{timeproperty}</strong>
            </span>
          </div>

          {/* Charts Grid (1 chart per attribute) */}
          {isTemporalLoading && !temporalEntity ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-xl" />
              ))}
            </div>
          ) : temporalError ? (
            <div className="p-6 rounded-xl border bg-destructive/10 border-destructive/20 text-center space-y-2">
              <p className="text-sm font-semibold text-destructive">
                Failed to load temporal data
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {(temporalError as { message?: string })?.message ||
                  "Make sure Mintaka / TimescaleDB is running and reachable."}
              </p>
              <Button variant="outline" size="sm" onClick={handleRefreshAll}>
                Try Again
              </Button>
            </div>
          ) : attributeCharts.length === 0 ? (
            <div className="p-10 rounded-xl border bg-card text-center space-y-2">
              <LineChart className="size-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm font-semibold text-foreground">
                No attributes available to chart
              </p>
              <p className="text-xs text-muted-foreground">
                Once this entity receives attribute updates, their temporal
                evolution charts will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {attributeCharts.map(({ series, currentAttr }) => (
                <AttributeTemporalChart
                  key={series.name}
                  series={series}
                  currentAttr={currentAttr}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

