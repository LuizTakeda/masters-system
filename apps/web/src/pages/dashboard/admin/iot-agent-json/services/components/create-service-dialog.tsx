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
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { KeyRound, Layers, Loader2, Plus } from "lucide-react";
import type { CreateServiceItemType } from "@repo/types/endpoints/iot-agent/service.endpoints";
import type { HttpErrorType } from "@repo/types/commons";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (service: CreateServiceItemType) => Promise<void>;
  tenant: string;
  servicePath?: string;
};

export function CreateServiceDialog({
  open,
  onOpenChange,
  onConfirm,
  tenant,
  servicePath = "/",
}: Props) {
  const [apikey, setApikey] = useState("");
  const [resource, setResource] = useState("/iot/json");
  const [entityType, setEntityType] = useState("Device");
  const [cbroker, setCbroker] = useState("http://orion-ld:1026");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setApikey("");
    setResource("/iot/json");
    setEntityType("Device");
    setCbroker("http://orion-ld:1026");
  };

  const handleGenerateKey = () => {
    const randomKey = `key_${Math.random().toString(36).substring(2, 10)}`;
    setApikey(randomKey);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedKey = apikey.trim();
    const trimmedResource = resource.trim();

    if (!trimmedKey) {
      toast.add({
        title: "Validation error",
        description: "API Key is mandatory.",
        type: "error",
      });
      return;
    }

    if (!trimmedResource) {
      toast.add({
        title: "Validation error",
        description: "Resource path is mandatory (e.g. /iot/json).",
        type: "error",
      });
      return;
    }

    const payload: CreateServiceItemType = {
      apikey: trimmedKey,
      resource: trimmedResource,
      entity_type: entityType.trim() || "Thing",
      cbroker: cbroker.trim() || undefined,
    };

    try {
      setIsSubmitting(true);
      await onConfirm(payload);
      toast.add({
        title: "Service provisioned",
        description: `Service group with API Key "${trimmedKey}" created successfully.`,
        type: "success",
      });
      resetForm();
      onOpenChange(false);
    } catch (error) {
      const err = error as Partial<HttpErrorType>;
      toast.add({
        title: "Failed to provision service",
        description:
          err?.message || "Could not register service group in IoT Agent.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
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
              <DialogTitle>Provision Service Group</DialogTitle>
              <DialogDescription>
                Create a new IoT Agent service group for tenant{" "}
                <strong className="text-foreground font-mono">{tenant}</strong>
                {" "}on path{" "}
                <code className="bg-muted px-1 py-0.5 rounded text-[11px] font-mono text-foreground">
                  {servicePath}
                </code>
                .
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                API Key <span className="text-destructive">*</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateKey}
                className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 font-medium cursor-pointer"
              >
                <KeyRound className="size-3" />
                <span>Generate key</span>
              </button>
            </div>
            <Input
              value={apikey}
              onChange={(e) => setApikey(e.target.value)}
              placeholder="e.g. apitest or greenhouse_sec_key"
              required
              className="font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Used by devices in MQTT topics:{" "}
              <code className="bg-muted px-1 py-0.5 rounded text-[10px]">
                /&lt;apikey&gt;/&lt;device_id&gt;/attrs
              </code>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Resource */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Resource <span className="text-destructive">*</span>
              </label>
              <Input
                value={resource}
                onChange={(e) => setResource(e.target.value)}
                placeholder="/iot/json"
                required
                className="font-mono text-xs"
              />
            </div>

            {/* Default Entity Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Default Entity Type
              </label>
              <Input
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                placeholder="Device or Thing"
                className="text-xs"
              />
            </div>
          </div>

          {/* Context Broker Endpoint */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Context Broker URL
            </label>
            <Input
              value={cbroker}
              onChange={(e) => setCbroker(e.target.value)}
              placeholder="http://orion-ld:1026"
              className="font-mono text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-1.5">
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Provisioning...</span>
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  <span>Provision Service</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
