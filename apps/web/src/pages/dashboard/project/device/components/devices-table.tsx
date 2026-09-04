import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Check,
  Copy,
  Cpu,
  Info,
  Layers,
  Pencil,
  Plus,
  Radio,
  Trash2,
} from "lucide-react";
import type { IotDeviceType } from "@repo/types/endpoints/iot-agent/device.endpoints";

type Props = {
  devices?: IotDeviceType[];
  isLoading: boolean;
  isError: unknown;
  onSelectDevice: (device: IotDeviceType) => void;
  onEditDevice: (device: IotDeviceType) => void;
  onDeleteDevice: (device: IotDeviceType) => void;
  onCreateDevice?: () => void;
};

export function DevicesTable({
  devices,
  isLoading,
  isError,
  onSelectDevice,
  onEditDevice,
  onDeleteDevice,
  onCreateDevice,
}: Props) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-1/4">Device ID</TableHead>
          <TableHead className="w-1/4">Context Broker Entity</TableHead>
          <TableHead className="w-1/6">Protocol / Transport</TableHead>
          <TableHead className="w-1/6">Attributes</TableHead>
          <TableHead className="w-24 text-center">API Key</TableHead>
          <TableHead className="w-28 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Skeleton className="size-8 rounded-md shrink-0" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-14" />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1.5">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20 rounded-full" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-5 w-16 mx-auto rounded-md" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-8 w-20 ml-auto rounded-md" />
              </TableCell>
            </TableRow>
          ))
        ) : isError ? (
          <TableRow>
            <TableCell
              colSpan={6}
              className="h-24 text-center text-muted-foreground"
            >
              Failed to load devices. Make sure IoT Agent is online and
              reachable.
            </TableCell>
          </TableRow>
        ) : !devices || devices.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={6}
              className="h-36 text-center text-muted-foreground"
            >
              <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                <div className="p-3 rounded-full bg-primary/10 text-primary border border-primary/20">
                  <Cpu className="size-6" />
                </div>
                <span className="font-semibold text-foreground text-sm">
                  No devices registered
                </span>
                <span className="text-xs text-muted-foreground">
                  Register your first hardware sensor or ESP32 actuator to begin
                  publishing telemetry data.
                </span>
                {onCreateDevice && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onCreateDevice}
                    className="mt-1 gap-1.5"
                  >
                    <Plus className="size-3.5" />
                    <span>Register Device</span>
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ) : (
          devices.map((device) => {
            const isCopied = copiedKey === device.device_id;
            const attrCount = device.attributes?.length ?? 0;
            const staticCount = device.static_attributes?.length ?? 0;
            const cmdCount = device.commands?.length ?? 0;

            return (
              <TableRow key={device.device_id}>
                {/* Device ID */}
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                      <Cpu className="size-4" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-foreground">
                        <span>{device.device_id}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(device.device_id)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Copy Device ID"
                        >
                          {isCopied ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </button>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {device.timezone || "America/Sao_Paulo"}
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* Entity Name & Type */}
                <TableCell>
                  <div className="space-y-0.5">
                    <div
                      className="font-mono text-xs text-foreground truncate max-w-[200px]"
                      title={device.entity_name}
                    >
                      {device.entity_name ||
                        `urn:ngsi-ld:${device.entity_type || "Device"}:${device.device_id}`}
                    </div>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border">
                      {device.entity_type || "Device"}
                    </span>
                  </div>
                </TableCell>

                {/* Protocol & Transport */}
                <TableCell>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-secondary-foreground border">
                      <Radio className="size-3 text-emerald-500" />
                      <span>{device.transport || "MQTT"}</span>
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                      {device.protocol || "IoTA-JSON"}
                    </span>
                  </div>
                </TableCell>

                {/* Attributes count badge */}
                <TableCell>
                  <div className="flex items-center gap-1 flex-wrap text-xs">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-muted font-medium text-foreground border"
                      title={`${attrCount} dynamic attributes`}
                    >
                      <Layers className="size-3 text-primary" />
                      <span>{attrCount} attrs</span>
                    </span>
                    {staticCount > 0 && (
                      <span
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-muted/60 text-muted-foreground border"
                        title={`${staticCount} static attributes`}
                      >
                        +{staticCount} static
                      </span>
                    )}
                    {cmdCount > 0 && (
                      <span
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        title={`${cmdCount} commands`}
                      >
                        {cmdCount} cmd
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* API Key */}
                <TableCell className="text-center">
                  {device.apikey ? (
                    <span className="font-mono text-xs bg-muted/60 px-2 py-0.5 rounded border text-foreground">
                      {device.apikey}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground italic">
                      Service default
                    </span>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onSelectDevice(device)}
                      className="text-muted-foreground hover:text-foreground"
                      title="View Details & Telemetry instructions"
                    >
                      <Info className="size-3.5" />
                      <span className="sr-only">Details</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onEditDevice(device)}
                      className="text-muted-foreground hover:text-foreground"
                      title="Edit Device"
                    >
                      <Pencil className="size-3.5" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onDeleteDevice(device)}
                      className="text-muted-foreground hover:text-destructive"
                      title="Delete Device"
                    >
                      <Trash2 className="size-3.5" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
