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
import { Check, Copy, Info, KeyRound, Layers, Trash2 } from "lucide-react";
import type { IotServiceGroupType } from "@repo/types/endpoints/iot-agent/service.endpoints";

type Props = {
  services?: IotServiceGroupType[];
  isLoading: boolean;
  isError: unknown;
  onSelectService: (service: IotServiceGroupType) => void;
  onDeleteService: (service: IotServiceGroupType) => void;
};

export function ServicesTable({
  services,
  isLoading,
  isError,
  onSelectService,
  onDeleteService,
}: Props) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-1/4">API Key</TableHead>
          <TableHead className="w-1/5">Resource</TableHead>
          <TableHead className="w-1/5">Default Entity Type</TableHead>
          <TableHead className="w-1/5">Context Broker</TableHead>
          <TableHead className="w-24 text-center">Subservice</TableHead>
          <TableHead className="w-24 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Skeleton className="size-7 rounded-md shrink-0" />
                  <Skeleton className="h-5 w-32" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-36" />
              </TableCell>
              <TableCell className="text-center">
                <Skeleton className="h-5 w-12 mx-auto rounded-full" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-8 w-16 ml-auto rounded-md" />
              </TableCell>
            </TableRow>
          ))
        ) : isError ? (
          <TableRow>
            <TableCell
              colSpan={6}
              className="h-24 text-center text-muted-foreground"
            >
              Failed to load service groups. Check tenant name and broker
              connectivity.
            </TableCell>
          </TableRow>
        ) : !services || services.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={6}
              className="h-32 text-center text-muted-foreground"
            >
              <div className="flex flex-col items-center justify-center gap-1.5">
                <Layers className="size-8 text-muted-foreground/60" />
                <span className="font-medium text-foreground text-sm">
                  No service groups found
                </span>
                <span className="text-xs">
                  Provision a new service group with an API Key to start
                  registering devices.
                </span>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          services.map((service, index) => {
            const isCopied = copiedKey === service.apikey;

            return (
              <TableRow
                key={
                  service._id ||
                  `${service.apikey}-${service.resource}-${index}`
                }
              >
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0">
                      <KeyRound className="size-3.5" />
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-foreground bg-muted/50 px-2 py-0.5 rounded-md border">
                      <span>{service.apikey}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyKey(service.apikey)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy API Key"
                      >
                        {isCopied ? (
                          <Check className="size-3 text-emerald-500" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <span className="font-mono text-xs text-muted-foreground">
                    {service.resource}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border">
                    {service.entity_type || "Thing"}
                  </span>
                </TableCell>

                <TableCell>
                  <span
                    className="text-xs text-muted-foreground truncate max-w-[200px] block"
                    title={service.cbroker || "Default Orion-LD"}
                  >
                    {service.cbroker || "Default (Orion-LD)"}
                  </span>
                </TableCell>

                <TableCell className="text-center">
                  <span className="font-mono text-xs text-muted-foreground">
                    {service.service_path || "/"}
                  </span>
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onSelectService(service)}
                      title="View Details"
                    >
                      <Info className="size-3.5" />
                      <span className="sr-only">Details</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onDeleteService(service)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      title="Delete Service"
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
