import { useState, useMemo } from "react";
import { useParams, useSearchParams } from "react-router";
import PageHeader from "@/pages/dashboard/components/page-header";
import { useDevices } from "@/hooks/iot-agent/use-device";
import { useServices } from "@/hooks/iot-agent/use-service";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatProjectString } from "@/lib/utils";
import { Cpu, Filter, FolderTree, Plus, Search } from "lucide-react";
import type {
  CreateDeviceItemType,
  IotDeviceType,
  UpdateDeviceBodyType,
} from "@repo/types/endpoints/iot-agent/device.endpoints";
import type { HttpErrorType } from "@repo/types/commons";
import { DevicesTable } from "./components/devices-table";
import { TablePagination } from "./components/table-pagination";
import { CreateDeviceDialog } from "./components/create-device-dialog";
import { EditDeviceDialog } from "./components/edit-device-dialog";
import { DeviceDetailsDialog } from "./components/device-details-dialog";
import { DeleteDeviceDialog } from "./components/delete-device-dialog";

const PAGE_SIZE = 10;

export default function ProjectDevicePage() {
  const { project } = useParams<{ project: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [servicePathInput, setServicePathInput] = useState("/");
  const [activeServicePath, setActiveServicePath] = useState("/");

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<IotDeviceType | null>(
    null,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<IotDeviceType | null>(
    null,
  );

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  // Retrieve devices for this project
  const {
    devices,
    count: totalCount = 0,
    isLoading,
    isError,
    createDevice,
    updateDevice,
    deleteDevice,
  } = useDevices(
    project
      ? {
          service: project,
          servicePath: activeServicePath,
        }
      : null,
    {
      limit: PAGE_SIZE,
      offset,
      detailed: "on",
    },
  );

  // Retrieve services for default API key discovery
  const { services: projectServices } = useServices(
    project ? { service: project, servicePath: "/" } : null,
  );
  const defaultApiKey = projectServices?.[0]?.apikey || "";

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
    setActiveServicePath(servicePathInput.trim() || "/");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", "1");
      return next;
    });
  };

  // Filter devices locally by search query if desired
  const filteredDevices = useMemo(() => {
    if (!devices) return [];
    if (!searchQuery.trim()) return devices;
    const q = searchQuery.toLowerCase();
    return devices.filter(
      (d) =>
        d.device_id.toLowerCase().includes(q) ||
        (d.entity_name && d.entity_name.toLowerCase().includes(q)) ||
        (d.entity_type && d.entity_type.toLowerCase().includes(q)) ||
        (d.apikey && d.apikey.toLowerCase().includes(q)),
    );
  }, [devices, searchQuery]);

  // Dialog Open Handlers
  const handleOpenDetails = (device: IotDeviceType) => {
    setSelectedDevice(device);
    setIsDetailsOpen(true);
  };

  const handleOpenEdit = (device: IotDeviceType) => {
    setSelectedDevice(device);
    setIsEditOpen(true);
  };

  const handleOpenDelete = (device: IotDeviceType) => {
    setDeviceToDelete(device);
    setIsDeleteDialogOpen(true);
  };

  // Mutation Handlers
  const handleCreateConfirm = async (deviceItem: CreateDeviceItemType) => {
    await createDevice(deviceItem);
  };

  const handleEditConfirm = async (
    deviceId: string,
    body: UpdateDeviceBodyType,
  ) => {
    await updateDevice(deviceId, body);
  };

  const handleDeleteConfirm = async (deviceId: string) => {
    try {
      const res = await deleteDevice(deviceId);
      toast.add({
        title: "Device deleted successfully",
        description:
          res?.message ||
          `Device "${deviceId}" has been removed from IoT Agent.`,
        type: "success",
      });
    } catch (error) {
      const err = error as Partial<HttpErrorType>;
      toast.add({
        title: "Failed to delete device",
        description:
          err.message || "Could not remove the device from registry.",
        type: "error",
      });
      throw error;
    }
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
          { label: "Devices" },
        ]}
      />

      <div className="p-6 space-y-5 max-w-7xl mx-auto">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border bg-card text-card-foreground shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
              <Cpu className="size-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold tracking-tight text-foreground">
                  IoT Devices Management
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  <span className="size-1.5 rounded-full bg-primary" />
                  <span className="font-mono">{project}</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                Register hardware devices, configure MQTT JSON attribute
                mappings, and inspect live Context Broker telemetry bindings for
                this project tenant.
              </p>
            </div>
          </div>

          <Button
            onClick={() => setIsCreateOpen(true)}
            size="sm"
            className="gap-1.5 self-start sm:self-auto shrink-0"
          >
            <Plus className="size-4" />
            <span>Register Device</span>
          </Button>
        </div>

        {/* Filter & Search Bar */}
        <div className="rounded-lg border bg-card p-3 shadow-xs">
          <form
            onSubmit={handleApplyFilter}
            className="flex flex-wrap items-center gap-3"
          >
            {/* Search Input */}
            <div className="flex items-center gap-1.5 min-w-[220px] flex-1">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <label htmlFor="search-device-input" className="sr-only">
                  Search devices
                </label>
                <Input
                  id="search-device-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by device ID, entity, or API Key..."
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            {/* Subservice Path Input */}
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
              <span>Apply Path</span>
            </Button>
          </form>
        </div>

        {/* Main Table Card */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden">
          <DevicesTable
            devices={filteredDevices}
            isLoading={isLoading}
            isError={isError}
            onSelectDevice={handleOpenDetails}
            onEditDevice={handleOpenEdit}
            onDeleteDevice={handleOpenDelete}
            onCreateDevice={() => setIsCreateOpen(true)}
          />

          <TablePagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            isLoading={isLoading}
            onPageChange={handlePageChange}
            resourceName={{ singular: "device", plural: "devices" }}
          />
        </div>

        {/* Dialogs */}
        <CreateDeviceDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onConfirm={handleCreateConfirm}
          tenant={project}
          servicePath={activeServicePath}
        />

        <EditDeviceDialog
          device={selectedDevice}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onConfirm={handleEditConfirm}
        />

        <DeviceDetailsDialog
          device={selectedDevice}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          defaultApiKey={defaultApiKey}
        />

        <DeleteDeviceDialog
          device={deviceToDelete}
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
        />
      </div>
    </div>
  );
}
