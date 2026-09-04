import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy, KeyRound, Layers, Radio } from "lucide-react";
import type { IotServiceGroupType } from "@repo/types/endpoints/iot-agent/service.endpoints";

type Props = {
  service: IotServiceGroupType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ServiceDetailsDialog({ service, open, onOpenChange }: Props) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedTopic, setCopiedTopic] = useState(false);

  if (!service) return null;

  const mqttTopicTemplate = `/${service.apikey}/<device_id>/attrs`;

  const handleCopyKey = () => {
    navigator.clipboard.writeText(service.apikey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyTopic = () => {
    navigator.clipboard.writeText(mqttTopicTemplate);
    setCopiedTopic(true);
    setTimeout(() => setCopiedTopic(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Layers className="size-4" />
            </div>
            <div>
              <DialogTitle>Service Group Details</DialogTitle>
              <DialogDescription>
                Configuration parameters and MQTT integration for this service.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* API Key Box */}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5">
                <KeyRound className="size-3.5 text-primary" />
                API Key
              </span>
              <button
                type="button"
                onClick={handleCopyKey}
                className="text-primary hover:underline inline-flex items-center gap-1 text-[11px]"
              >
                {copiedKey ? (
                  <>
                    <Check className="size-3 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3" />
                    <span>Copy Key</span>
                  </>
                )}
              </button>
            </div>
            <div className="font-mono text-sm font-semibold text-foreground select-all">
              {service.apikey}
            </div>
          </div>

          {/* MQTT Topic Helper */}
          <div className="rounded-lg border bg-secondary/40 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5">
                <Radio className="size-3.5 text-emerald-500" />
                MQTT Telemetry Topic Template
              </span>
              <button
                type="button"
                onClick={handleCopyTopic}
                className="text-primary hover:underline inline-flex items-center gap-1 text-[11px]"
              >
                {copiedTopic ? (
                  <>
                    <Check className="size-3 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3" />
                    <span>Copy Topic</span>
                  </>
                )}
              </button>
            </div>
            <div className="font-mono text-xs text-foreground bg-background px-2.5 py-1.5 rounded border select-all">
              {mqttTopicTemplate}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Replace{" "}
              <code className="text-primary font-mono">&lt;device_id&gt;</code>{" "}
              with your hardware identifier (e.g.{" "}
              <code className="font-mono">esp32_01</code>).
            </p>
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-md border p-2.5 space-y-1 bg-card">
              <span className="text-muted-foreground font-medium block">
                Resource URI
              </span>
              <span className="font-mono font-medium text-foreground block truncate">
                {service.resource}
              </span>
            </div>

            <div className="rounded-md border p-2.5 space-y-1 bg-card">
              <span className="text-muted-foreground font-medium block">
                Default Entity Type
              </span>
              <span className="font-medium text-foreground block truncate">
                {service.entity_type || "Thing"}
              </span>
            </div>

            <div className="rounded-md border p-2.5 space-y-1 bg-card">
              <span className="text-muted-foreground font-medium block">
                Tenant (Fiware-Service)
              </span>
              <span className="font-medium text-foreground block truncate">
                {service.service || "-"}
              </span>
            </div>

            <div className="rounded-md border p-2.5 space-y-1 bg-card">
              <span className="text-muted-foreground font-medium block">
                Subservice (ServicePath)
              </span>
              <span className="font-mono font-medium text-foreground block truncate">
                {service.service_path || "/"}
              </span>
            </div>

            <div className="col-span-2 rounded-md border p-2.5 space-y-1 bg-card">
              <span className="text-muted-foreground font-medium block">
                Context Broker Endpoint
              </span>
              <span className="font-mono text-[11px] text-foreground block truncate">
                {service.cbroker ||
                  "Default internal broker (http://orion-ld:1026)"}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
