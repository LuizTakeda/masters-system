import { useState, useMemo } from "react";
import { useSearchParams } from "react-router";
import { useServices } from "@/hooks/iot-agent/use-service";
import { useMe } from "@/hooks/use-me";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Filter, FolderTree, Plus } from "lucide-react";
import type {
  CreateServiceItemType,
  IotServiceGroupType,
} from "@repo/types/endpoints/iot-agent/service.endpoints";
import type { HttpErrorType } from "@repo/types/commons";
import { ServicesTable } from "./components/services-table";
import { TablePagination } from "../components/table-pagination";
import { CreateServiceDialog } from "./components/create-service-dialog";
import { ServiceDetailsDialog } from "./components/service-details-dialog";
import { DeleteServiceDialog } from "./components/delete-service-dialog";

const PAGE_SIZE = 10;

export default function ServicesPage() {
  const { user } = useMe();
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract available projects/tenants from user groups
  const availableProjects = useMemo(() => {
    if (!user) return ["project-greenhouse"];
    const projects = user.groups.filter((g) => g.startsWith("project-"));
    return projects.length > 0 ? projects : ["project-greenhouse"];
  }, [user]);

  // Tenant / Subservice state
  const [tenantInput, setTenantInput] = useState(
    () => availableProjects[0] || "project-greenhouse",
  );
  const [servicePathInput, setServicePathInput] = useState("/");
  const [activeTenant, setActiveTenant] = useState(
    () => availableProjects[0] || "project-greenhouse",
  );
  const [activeServicePath, setActiveServicePath] = useState("/");

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedService, setSelectedService] =
    useState<IotServiceGroupType | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] =
    useState<IotServiceGroupType | null>(null);

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const {
    services,
    count: totalCount = 0,
    isLoading,
    isError,
    createService,
    deleteService,
  } = useServices(
    activeTenant
      ? {
          service: activeTenant,
          servicePath: activeServicePath,
        }
      : null,
    {
      limit: PAGE_SIZE,
      offset,
    },
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(newPage));
      return next;
    });
  };

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveTenant(tenantInput.trim());
    setActiveServicePath(servicePathInput.trim() || "/");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", "1");
      return next;
    });
  };

  const handleOpenDetails = (service: IotServiceGroupType) => {
    setSelectedService(service);
    setIsDetailsOpen(true);
  };

  const handleOpenDelete = (service: IotServiceGroupType) => {
    setServiceToDelete(service);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateConfirm = async (serviceItem: CreateServiceItemType) => {
    await createService(serviceItem);
  };

  const handleDeleteConfirm = async (
    service: IotServiceGroupType,
    deleteDevices: boolean,
  ) => {
    try {
      const res = await deleteService({
        resource: service.resource,
        apikey: service.apikey,
        device: deleteDevices,
      });

      toast.add({
        title: "Service deleted successfully",
        description:
          res?.message ||
          `Service with API Key "${service.apikey}" has been removed.`,
        type: "success",
      });
    } catch (error) {
      const err = error as Partial<HttpErrorType>;
      toast.add({
        title: "Failed to delete service",
        description: err.message || "Could not remove the service group.",
        type: "error",
      });
      throw error;
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Service Groups
          </h2>
          <p className="text-xs text-muted-foreground">
            Manage multi-tenant service groups, API keys, and resource
            endpoints.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          size="sm"
          className="gap-1.5 self-start sm:self-auto"
        >
          <Plus className="size-4" />
          <span>Provision Service</span>
        </Button>
      </div>

      {/* Tenant / Subservice Selector Filter Bar */}
      <div className="rounded-lg border bg-card p-3 shadow-xs">
        <form
          onSubmit={handleApplyFilter}
          className="flex flex-wrap items-center gap-3"
        >
          <div className="flex items-center gap-1.5 min-w-[240px] flex-1">
            <Building2 className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <label htmlFor="tenant-input" className="sr-only">
                Tenant (Fiware-Service)
              </label>
              <Input
                id="tenant-input"
                value={tenantInput}
                onChange={(e) => setTenantInput(e.target.value)}
                placeholder="Tenant (e.g. project-greenhouse)"
                className="h-8 text-xs font-mono"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 min-w-[180px]">
            <FolderTree className="size-4 text-muted-foreground shrink-0" />
            <div className="flex-1">
              <label htmlFor="subservice-input" className="sr-only">
                Subservice (Fiware-ServicePath)
              </label>
              <Input
                id="subservice-input"
                value={servicePathInput}
                onChange={(e) => setServicePathInput(e.target.value)}
                placeholder="Path (e.g. / or /*)"
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="secondary"
            size="sm"
            className="h-8 gap-1.5 text-xs"
          >
            <Filter className="size-3.5" />
            <span>Apply</span>
          </Button>

          {availableProjects.length > 1 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground overflow-x-auto">
              <span>Quick switch:</span>
              {availableProjects.map((proj) => (
                <button
                  key={proj}
                  type="button"
                  onClick={() => {
                    setTenantInput(proj);
                    setActiveTenant(proj);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    activeTenant === proj
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  }`}
                >
                  {proj}
                </button>
              ))}
            </div>
          )}
        </form>
      </div>

      {/* Main Table Card */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden">
        <ServicesTable
          services={services}
          isLoading={isLoading}
          isError={isError}
          onSelectService={handleOpenDetails}
          onDeleteService={handleOpenDelete}
        />

        <TablePagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          resourceName={{ singular: "service group", plural: "service groups" }}
        />
      </div>

      {/* Dialogs */}
      <CreateServiceDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onConfirm={handleCreateConfirm}
        tenant={activeTenant}
        servicePath={activeServicePath}
      />

      <ServiceDetailsDialog
        service={selectedService}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      <DeleteServiceDialog
        service={serviceToDelete}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
