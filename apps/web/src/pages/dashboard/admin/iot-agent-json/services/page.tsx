import { useState, useMemo } from "react";
import { useSearchParams } from "react-router";
import { useServices } from "@/hooks/iot-agent/use-service";
import { useMe } from "@/hooks/use-me";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatProjectString } from "@/lib/utils";
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
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
  const { user, isLoading: isUserLoading } = useMe();
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract available projects/tenants from user.groups
  const availableProjects = useMemo(() => {
    return user?.groups ?? [];
  }, [user]);

  // Selected project/tenant state
  const [selectedTenant, setSelectedTenant] = useState<string>("");

  const activeTenant = useMemo(() => {
    if (selectedTenant && availableProjects.includes(selectedTenant)) {
      return selectedTenant;
    }
    return availableProjects[0] ?? "";
  }, [selectedTenant, availableProjects]);

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
          servicePath: "/",
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

  const handleSelectTenant = (tenant: string) => {
    setSelectedTenant(tenant);
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
          disabled={!activeTenant}
          className="gap-1.5 self-start sm:self-auto"
        >
          <Plus className="size-4" />
          <span>Provision Service</span>
        </Button>
      </div>

      {/* Project / Tenant Selector Bar */}
      <div className="rounded-lg border bg-card p-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Building2 className="size-4 shrink-0 text-primary" />
              <span>Project (Tenant):</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUserLoading || availableProjects.length === 0}
                    className="h-8 min-w-[200px] justify-between gap-2 text-xs font-mono"
                  />
                }
              >
                <span className="truncate">
                  {isUserLoading
                    ? "Loading projects..."
                    : activeTenant || "No projects available"}
                </span>
                <ChevronsUpDown className="size-3.5 text-muted-foreground shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[220px]">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Select Project Tenant
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableProjects.map((proj) => {
                    const isSelected = proj === activeTenant;
                    return (
                      <DropdownMenuItem
                        key={proj}
                        onClick={() => handleSelectTenant(proj)}
                        className="flex items-center justify-between gap-2 text-xs cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium capitalize">
                            {formatProjectString(proj)}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {proj}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="size-3.5 text-primary shrink-0" />
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {availableProjects.length > 1 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground overflow-x-auto">
              <span className="shrink-0">Projects:</span>
              {availableProjects.map((proj) => (
                <button
                  key={proj}
                  type="button"
                  onClick={() => handleSelectTenant(proj)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors cursor-pointer ${
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
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden">
        <ServicesTable
          services={services}
          isLoading={isLoading || isUserLoading}
          isError={isError}
          onSelectService={handleOpenDetails}
          onDeleteService={handleOpenDelete}
        />

        <TablePagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          isLoading={isLoading || isUserLoading}
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
