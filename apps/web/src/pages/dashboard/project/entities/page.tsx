import { useState, useMemo } from "react";
import { useParams, useSearchParams } from "react-router";
import PageHeader from "@/pages/dashboard/components/page-header";
import { useEntities } from "@/hooks/ngsi-ld/use-entities";
import { useEntityTypeList } from "@/hooks/ngsi-ld/use-type";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatProjectString } from "@/lib/utils";
import { Boxes, Database, Layers, RefreshCw, Search, Tag } from "lucide-react";
import type { NgsiLdEntityType } from "@repo/types/endpoints/ngsi-ld/entities.endpoints";
import type { HttpErrorType } from "@repo/types/commons";
import { EntityCard } from "./components/entity-card";
import { EntityDetailsDialog } from "./components/entity-details-dialog";
import { DeleteEntityDialog } from "./components/delete-entity-dialog";
import { EntityPagination } from "./components/entity-pagination";

const PAGE_SIZE = 9;

export default function EntitiesPage() {
  const { project } = useParams<{ project: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search query filter (local filter for entity ID and property matches)
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [selectedEntity, setSelectedEntity] = useState<NgsiLdEntityType | null>(
    null,
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState<NgsiLdEntityType | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Headers for NGSI-LD operations
  const headers = useMemo(
    () => (project ? { tenant: project } : null),
    [project],
  );

  // 1. Fetch available entity types for this tenant
  const {
    typeList = [],
    isLoading: isTypesLoading,
    mutate: mutateTypes,
  } = useEntityTypeList(headers);

  // 2. Read query params: page & type
  const pageParam = Math.max(1, Number(searchParams.get("page")) || 1);
  const typeParam = searchParams.get("type");

  // Determine active type:
  // If ?type= is specified in URL, use it.
  // Otherwise default to the first type if available.
  const activeType = useMemo(() => {
    if (typeParam) return typeParam;
    if (typeList.length > 0) return typeList[0];
    return "ALL";
  }, [typeParam, typeList]);

  // If Orion-LD needs a type parameter or wildcard:
  const queryType = useMemo(() => {
    if (activeType === "ALL") {
      // In NGSI-LD, '*' or comma-separated list queries all types
      return typeList.length > 0 ? typeList.join(",") : "*";
    }
    return activeType;
  }, [activeType, typeList]);

  const offset = (pageParam - 1) * PAGE_SIZE;

  // 3. Query entities with 5-second polling
  const {
    entities,
    count: totalCount = 0,
    isLoading: isEntitiesLoading,
    isValidating,
    isError,
    mutate: mutateEntities,
    deleteEntity,
  } = useEntities(
    headers,
    {
      type: queryType || undefined,
      limit: PAGE_SIZE,
      offset,
    },
    { refreshInterval: 5000 },
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Handler for selecting type filter
  const handleSelectType = (typeName: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("type", typeName);
      next.set("page", "1");
      return next;
    });
  };

  // Handler for changing page
  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(newPage));
      return next;
    });
  };

  // Local filter by search query (matching ID or attributes)
  const filteredEntities = useMemo(() => {
    if (!entities) return [];
    if (!searchQuery.trim()) return entities;
    const q = searchQuery.toLowerCase();

    return entities.filter((entity) => {
      if (entity.id.toLowerCase().includes(q)) return true;
      const typeStr = Array.isArray(entity.type)
        ? entity.type.join(" ")
        : entity.type;
      if (typeStr && typeStr.toLowerCase().includes(q)) return true;

      // Match attribute names or string values
      for (const [key, val] of Object.entries(entity)) {
        if (key.toLowerCase().includes(q)) return true;
        if (typeof val === "object" && val !== null) {
          const record = val as Record<string, unknown>;
          if (record.value && String(record.value).toLowerCase().includes(q)) {
            return true;
          }
          if (
            record.object &&
            String(record.object).toLowerCase().includes(q)
          ) {
            return true;
          }
        }
      }
      return false;
    });
  }, [entities, searchQuery]);

  // Dialog handlers
  const handleOpenDetails = (entity: NgsiLdEntityType) => {
    setSelectedEntity(entity);
    setIsDetailsOpen(true);
  };

  const handleOpenDelete = (entity: NgsiLdEntityType) => {
    setEntityToDelete(entity);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async (entityId: string) => {
    try {
      await deleteEntity(entityId);
      toast.add({
        title: "Entity deleted successfully",
        description: `Entity "${entityId}" was removed from the Context Broker.`,
        type: "success",
      });
      await mutateEntities();
    } catch (error) {
      const err = error as Partial<HttpErrorType>;
      toast.add({
        title: "Failed to delete entity",
        description:
          err.message || "An error occurred while deleting the entity.",
        type: "error",
      });
      throw error;
    }
  };

  const handleManualRefresh = async () => {
    await Promise.all([mutateTypes(), mutateEntities()]);
    toast.add({
      title: "Refreshed",
      description: "Entity data synchronized with Context Broker.",
      type: "success",
    });
  };

  if (!project) return null;

  const projectTitle = formatProjectString(project);

  return (
    <div>
      <PageHeader
        items={[
          {
            label: projectTitle,
            to: `/dashboard/${encodeURIComponent(project)}`,
          },
          { label: "Entities" },
        ]}
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border bg-card text-card-foreground shadow-2xs">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
              <Database className="size-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold tracking-tight text-foreground">
                  NGSI-LD Entities
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  <span className="size-1.5 rounded-full bg-primary" />
                  <span className="font-mono">{project}</span>
                </span>
                {/* Live Polling Badge */}
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  title="Entities refresh automatically every 5 seconds via SWR polling"
                >
                  <span
                    className={`size-1.5 rounded-full bg-emerald-500 ${
                      isValidating ? "animate-ping" : "animate-pulse"
                    }`}
                  />
                  <span>Live (5s)</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                Real-time Context Broker entity explorer. View digital twins,
                live telemetry properties, and relationship graphs for this
                tenant.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              className="gap-1.5 text-xs h-8"
              title="Manual refresh"
            >
              <RefreshCw
                className={`size-3.5 ${isValidating ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Filters & Type Bar */}
        <div className="space-y-3">
          {/* Types Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground shrink-0 pr-1">
              <Tag className="size-3.5" />
              <span>Types:</span>
            </div>

            <Button
              variant={activeType === "ALL" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSelectType("ALL")}
              className="h-7 text-xs rounded-full gap-1.5 shrink-0"
            >
              <Layers className="size-3" />
              <span>All Types</span>
              {totalCount > 0 && activeType === "ALL" && (
                <span className="text-[10px] font-mono px-1 rounded bg-background/20">
                  {totalCount}
                </span>
              )}
            </Button>

            {isTypesLoading ? (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="animate-pulse">Loading types...</span>
              </div>
            ) : (
              typeList.map((typeName) => {
                const isSelected = activeType === typeName;
                return (
                  <Button
                    key={typeName}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSelectType(typeName)}
                    className="h-7 text-xs rounded-full gap-1.5 shrink-0"
                  >
                    <span>{typeName}</span>
                    {isSelected && (
                      <span className="text-[10px] font-mono px-1 rounded bg-background/20">
                        {totalCount}
                      </span>
                    )}
                  </Button>
                );
              })
            )}
          </div>

          {/* Search & Stats Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-lg border bg-card shadow-xs">
            <div className="flex items-center gap-2 w-full sm:max-w-md">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by entity ID, property name or value..."
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="text-xs text-muted-foreground self-end sm:self-auto">
              <span>
                Found{" "}
                <strong className="text-foreground font-semibold">
                  {totalCount}
                </strong>{" "}
                {totalCount === 1 ? "entity" : "entities"}
              </span>
              {activeType !== "ALL" && (
                <span className="ml-1">
                  of type{" "}
                  <strong className="text-foreground font-semibold">
                    {activeType}
                  </strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Entities Cards Grid (3 cards per row, 9 per page) */}
        {isEntitiesLoading && entities.length === 0 ? (
          // Loading Skeletons Grid (3x3 = 9 items)
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="h-56 rounded-xl border bg-card/60 p-4 flex flex-col justify-between animate-pulse space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="h-5 w-20 bg-muted rounded-full" />
                    <div className="h-5 w-12 bg-muted rounded" />
                  </div>
                  <div className="h-4 w-36 bg-muted rounded mt-2" />
                </div>
                <div className="grid grid-cols-2 gap-2 my-2">
                  <div className="h-12 bg-muted/60 rounded" />
                  <div className="h-12 bg-muted/60 rounded" />
                  <div className="h-12 bg-muted/60 rounded" />
                  <div className="h-12 bg-muted/60 rounded" />
                </div>
                <div className="h-4 w-28 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 border rounded-xl bg-destructive/10 border-destructive/20 text-center space-y-2">
            <p className="text-sm font-semibold text-destructive">
              Failed to load NGSI-LD entities
            </p>
            <p className="text-xs text-muted-foreground">
              Please check if the Context Broker (Orion-LD) is reachable for
              tenant <code className="font-mono">{project}</code>.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        ) : filteredEntities.length === 0 ? (
          // Empty State
          <div className="p-12 border rounded-xl bg-card text-center flex flex-col items-center justify-center space-y-3">
            <div className="p-3 rounded-full bg-muted text-muted-foreground">
              <Boxes className="size-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">
                No entities found
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm">
                {searchQuery
                  ? `No entities matched filter "${searchQuery}". Try clearing the search query.`
                  : `No entities registered for type "${activeType}" in workspace tenant "${project}".`}
              </p>
            </div>
            {searchQuery ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery("")}
              >
                Clear Filter
              </Button>
            ) : (
              <p className="text-[11px] text-muted-foreground/70">
                Entities are automatically created when IoT devices provisioned
                in the Devices section publish MQTT telemetry.
              </p>
            )}
          </div>
        ) : (
          // Main 3-column Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEntities.map((entity) => (
              <EntityCard
                key={entity.id}
                entity={entity}
                onSelect={handleOpenDetails}
                onDelete={handleOpenDelete}
              />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        <EntityPagination
          page={pageParam}
          totalPages={totalPages}
          totalCount={totalCount}
          isLoading={isEntitiesLoading}
          onPageChange={handlePageChange}
          resourceName={{ singular: "entity", plural: "entities" }}
        />

        {/* Dialogs */}
        <EntityDetailsDialog
          entity={selectedEntity}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
        />

        <DeleteEntityDialog
          entity={entityToDelete}
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
        />
      </div>
    </div>
  );
}
