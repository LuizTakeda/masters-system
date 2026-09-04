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
import { Cpu, Layers, Loader2, Plus, Sliders, Trash2 } from "lucide-react";
import type {
  CreateDeviceItemType,
  IotDeviceAttributeType,
  IotDeviceCommandType,
  IotDeviceStaticAttributeType,
} from "@repo/types/endpoints/iot-agent/device.endpoints";
import type { HttpErrorType } from "@repo/types/commons";
import { useServices } from "@/hooks/iot-agent/use-service";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (device: CreateDeviceItemType) => Promise<void>;
  tenant: string;
  servicePath?: string;
};

export function CreateDeviceDialog({
  open,
  onOpenChange,
  onConfirm,
  tenant,
  servicePath = "/",
}: Props) {
  // Query existing services for this tenant to provide API key options
  const { services: existingServices, isLoading: isLoadingServices } =
    useServices(tenant ? { service: tenant, servicePath: "/" } : null);

  // Form State
  const [deviceId, setDeviceId] = useState("");
  const [entityName, setEntityName] = useState("");
  const [entityType, setEntityType] = useState("Device");
  const [protocol, setProtocol] = useState("IoTA-JSON");
  const [transport, setTransport] = useState("MQTT");
  const [apikey, setApikey] = useState("");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");

  // Dynamic attributes
  const [attributes, setAttributes] = useState<IotDeviceAttributeType[]>([
    { object_id: "t", name: "temperature", type: "Number" },
  ]);

  // Static attributes
  const [staticAttributes, setStaticAttributes] = useState<
    IotDeviceStaticAttributeType[]
  >([]);

  // Commands
  const [commands, setCommands] = useState<IotDeviceCommandType[]>([]);

  // Sub-tabs
  const [activeTab, setActiveTab] = useState<
    "general" | "attributes" | "advanced"
  >("general");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setDeviceId("");
    setEntityName("");
    setEntityType("Device");
    setProtocol("IoTA-JSON");
    setTransport("MQTT");
    setApikey("");
    setTimezone("America/Sao_Paulo");
    setAttributes([{ object_id: "t", name: "temperature", type: "Number" }]);
    setStaticAttributes([]);
    setCommands([]);
    setActiveTab("general");
  };

  // Attribute helpers
  const handleAddAttribute = () => {
    setAttributes((prev) => [
      ...prev,
      { object_id: "", name: "", type: "Number" },
    ]);
  };

  const handleUpdateAttribute = (
    index: number,
    field: keyof IotDeviceAttributeType,
    val: string,
  ) => {
    setAttributes((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item)),
    );
  };

  const handleRemoveAttribute = (index: number) => {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  // Static attribute helpers
  const handleAddStaticAttribute = () => {
    setStaticAttributes((prev) => [
      ...prev,
      { name: "", type: "Text", value: "" },
    ]);
  };

  const handleUpdateStaticAttribute = (
    index: number,
    field: keyof IotDeviceStaticAttributeType,
    val: string,
  ) => {
    setStaticAttributes((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item)),
    );
  };

  const handleRemoveStaticAttribute = (index: number) => {
    setStaticAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  // Command helpers
  const handleAddCommand = () => {
    setCommands((prev) => [...prev, { name: "", type: "command" }]);
  };

  const handleUpdateCommand = (
    index: number,
    field: keyof IotDeviceCommandType,
    val: string,
  ) => {
    setCommands((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item)),
    );
  };

  const handleRemoveCommand = (index: number) => {
    setCommands((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedDeviceId = deviceId.trim();
    if (!trimmedDeviceId) {
      toast.add({
        title: "Validation error",
        description: "Device ID is required (e.g. esp32_01).",
        type: "error",
      });
      setActiveTab("general");
      return;
    }

    // Filter valid attributes
    const cleanAttributes = attributes.filter(
      (a) => a.object_id.trim() && a.name.trim(),
    );

    // Filter valid static attributes
    const cleanStaticAttributes = staticAttributes.filter(
      (sa) => sa.name.trim() && sa.value !== "",
    );

    // Filter valid commands
    const cleanCommands = commands.filter((c) => c.name.trim());

    const payload: CreateDeviceItemType = {
      device_id: trimmedDeviceId,
      protocol: protocol.trim() || "IoTA-JSON",
      transport: transport.trim() || "MQTT",
      entity_type: entityType.trim() || "Device",
      entity_name:
        entityName.trim() ||
        `urn:ngsi-ld:${entityType.trim() || "Device"}:${trimmedDeviceId}`,
      apikey: apikey.trim() || undefined,
      timezone: timezone.trim() || undefined,
      attributes: cleanAttributes,
      static_attributes: cleanStaticAttributes,
      commands: cleanCommands,
    };

    try {
      setIsSubmitting(true);
      await onConfirm(payload);
      toast.add({
        title: "Device provisioned",
        description: `Device "${trimmedDeviceId}" successfully registered.`,
        type: "success",
      });
      resetForm();
      onOpenChange(false);
    } catch (error) {
      const err = error as Partial<HttpErrorType>;
      toast.add({
        title: "Failed to provision device",
        description:
          err?.message ||
          "Could not register device in IoT Agent. Check if service group exists.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="p-6 pb-3 border-b">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                <Cpu className="size-5" />
              </div>
              <div>
                <DialogTitle>Register IoT Device</DialogTitle>
                <DialogDescription>
                  Provision a new device for tenant{" "}
                  <strong className="text-foreground font-mono">
                    {tenant}
                  </strong>{" "}
                  ({servicePath}).
                </DialogDescription>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center gap-2 pt-3">
              <button
                type="button"
                onClick={() => setActiveTab("general")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === "general"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Cpu className="size-3.5" />
                <span>General</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("attributes")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === "attributes"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Layers className="size-3.5" />
                <span>Attributes ({attributes.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("advanced")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === "advanced"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Sliders className="size-3.5" />
                <span>
                  Static & Commands ({staticAttributes.length + commands.length}
                  )
                </span>
              </button>
            </div>
          </DialogHeader>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeTab === "general" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Device ID */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label
                      htmlFor="device-id-input"
                      className="text-xs font-medium text-foreground"
                    >
                      Device ID <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="device-id-input"
                      value={deviceId}
                      onChange={(e) => setDeviceId(e.target.value)}
                      placeholder="e.g. esp32_greenhouse_01"
                      className="font-mono text-xs"
                      required
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Unique device identifier used in MQTT topic paths.
                    </p>
                  </div>

                  {/* Entity Name */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="entity-name-input"
                      className="text-xs font-medium text-foreground"
                    >
                      Context Broker Entity Name
                    </label>
                    <Input
                      id="entity-name-input"
                      value={entityName}
                      onChange={(e) => setEntityName(e.target.value)}
                      placeholder={`urn:ngsi-ld:Device:${deviceId || "id"}`}
                      className="font-mono text-xs"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      NGSI-LD entity URN published to Orion-LD.
                    </p>
                  </div>

                  {/* Entity Type */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="entity-type-input"
                      className="text-xs font-medium text-foreground"
                    >
                      Entity Type
                    </label>
                    <Input
                      id="entity-type-input"
                      value={entityType}
                      onChange={(e) => setEntityType(e.target.value)}
                      placeholder="Device"
                      className="text-xs font-mono"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Default NGSI-LD type (e.g. Device, Sensor, AgriParcel).
                    </p>
                  </div>

                  {/* API Key Selection / Input */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label
                      htmlFor="apikey-input"
                      className="text-xs font-medium text-foreground"
                    >
                      Service Group API Key
                    </label>
                    <div className="flex gap-2">
                      <Input
                        id="apikey-input"
                        value={apikey}
                        onChange={(e) => setApikey(e.target.value)}
                        placeholder="Inherit from Service Group or specify"
                        className="font-mono text-xs flex-1"
                      />
                      {existingServices && existingServices.length > 0 && (
                        <select
                          className="h-9 px-2 text-xs font-mono rounded-md border bg-background text-foreground"
                          value={apikey}
                          onChange={(e) => setApikey(e.target.value)}
                        >
                          <option value="">Select Service Key...</option>
                          {existingServices.map((svc) => (
                            <option key={svc.apikey} value={svc.apikey}>
                              {svc.apikey} ({svc.resource})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {existingServices && existingServices.length > 0
                        ? "Select an existing provisioned service group key for this tenant, or leave blank to inherit default."
                        : isLoadingServices
                          ? "Loading service group API keys..."
                          : "No service group found. You can enter an API Key if provisioned by admin."}
                    </p>
                  </div>

                  {/* Transport */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="transport-input"
                      className="text-xs font-medium text-foreground"
                    >
                      Transport
                    </label>
                    <Input
                      id="transport-input"
                      value={transport}
                      onChange={(e) => setTransport(e.target.value)}
                      placeholder="MQTT"
                      className="text-xs font-mono"
                    />
                  </div>

                  {/* Timezone */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="timezone-input"
                      className="text-xs font-medium text-foreground"
                    >
                      Timezone
                    </label>
                    <Input
                      id="timezone-input"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      placeholder="America/Sao_Paulo"
                      className="text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "attributes" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">
                      Dynamic Attribute Mapping
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Map MQTT JSON keys (`object_id`) sent by your ESP32 to
                      NGSI-LD entity attributes (`name`).
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddAttribute}
                    className="h-8 gap-1 text-xs"
                  >
                    <Plus className="size-3.5" />
                    <span>Add Attribute</span>
                  </Button>
                </div>

                {attributes.length === 0 ? (
                  <div className="p-6 text-center border rounded-lg border-dashed text-xs text-muted-foreground">
                    No attributes mapped. Click &quot;Add Attribute&quot; to
                    define sensor mappings.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-muted-foreground px-1">
                      <div className="col-span-4">Protocol Key (JSON)</div>
                      <div className="col-span-4">Entity Attribute</div>
                      <div className="col-span-3">Data Type</div>
                      <div className="col-span-1 text-right">Del</div>
                    </div>

                    {attributes.map((attr, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-2 items-center"
                      >
                        <div className="col-span-4">
                          <Input
                            value={attr.object_id}
                            onChange={(e) =>
                              handleUpdateAttribute(
                                index,
                                "object_id",
                                e.target.value,
                              )
                            }
                            placeholder="e.g. t or temp"
                            className="h-8 font-mono text-xs"
                            required
                          />
                        </div>
                        <div className="col-span-4">
                          <Input
                            value={attr.name}
                            onChange={(e) =>
                              handleUpdateAttribute(
                                index,
                                "name",
                                e.target.value,
                              )
                            }
                            placeholder="e.g. temperature"
                            className="h-8 font-mono text-xs"
                            required
                          />
                        </div>
                        <div className="col-span-3">
                          <select
                            value={attr.type}
                            onChange={(e) =>
                              handleUpdateAttribute(
                                index,
                                "type",
                                e.target.value,
                              )
                            }
                            className="h-8 w-full rounded-md border bg-background px-2 text-xs font-mono text-foreground"
                          >
                            <option value="Number">Number</option>
                            <option value="Text">Text</option>
                            <option value="Boolean">Boolean</option>
                            <option value="Float">Float</option>
                            <option value="Integer">Integer</option>
                          </select>
                        </div>
                        <div className="col-span-1 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleRemoveAttribute(index)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "advanced" && (
              <div className="space-y-6">
                {/* Static Attributes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">
                        Static Attributes
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Fixed metadata published with the entity (e.g. location,
                        model).
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddStaticAttribute}
                      className="h-8 gap-1 text-xs"
                    >
                      <Plus className="size-3.5" />
                      <span>Add Static Attr</span>
                    </Button>
                  </div>

                  {staticAttributes.length === 0 ? (
                    <div className="p-4 text-center border rounded-lg border-dashed text-xs text-muted-foreground">
                      No static attributes defined.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {staticAttributes.map((sa, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-12 gap-2 items-center"
                        >
                          <div className="col-span-4">
                            <Input
                              value={sa.name}
                              onChange={(e) =>
                                handleUpdateStaticAttribute(
                                  index,
                                  "name",
                                  e.target.value,
                                )
                              }
                              placeholder="Name (e.g. brand)"
                              className="h-8 font-mono text-xs"
                            />
                          </div>
                          <div className="col-span-3">
                            <Input
                              value={sa.type}
                              onChange={(e) =>
                                handleUpdateStaticAttribute(
                                  index,
                                  "type",
                                  e.target.value,
                                )
                              }
                              placeholder="Type"
                              className="h-8 font-mono text-xs"
                            />
                          </div>
                          <div className="col-span-4">
                            <Input
                              value={String(sa.value ?? "")}
                              onChange={(e) =>
                                handleUpdateStaticAttribute(
                                  index,
                                  "value",
                                  e.target.value,
                                )
                              }
                              placeholder="Value (e.g. Espressif)"
                              className="h-8 font-mono text-xs"
                            />
                          </div>
                          <div className="col-span-1 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleRemoveStaticAttribute(index)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Commands */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">
                        Actuator Commands
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Commands that can be sent to the device (e.g. relay,
                        motor).
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddCommand}
                      className="h-8 gap-1 text-xs"
                    >
                      <Plus className="size-3.5" />
                      <span>Add Command</span>
                    </Button>
                  </div>

                  {commands.length === 0 ? (
                    <div className="p-4 text-center border rounded-lg border-dashed text-xs text-muted-foreground">
                      No commands configured.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {commands.map((cmd, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-12 gap-2 items-center"
                        >
                          <div className="col-span-8">
                            <Input
                              value={cmd.name}
                              onChange={(e) =>
                                handleUpdateCommand(
                                  index,
                                  "name",
                                  e.target.value,
                                )
                              }
                              placeholder="Command Name (e.g. relay_toggle)"
                              className="h-8 font-mono text-xs"
                            />
                          </div>
                          <div className="col-span-3">
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-muted text-muted-foreground border w-full">
                              command
                            </span>
                          </div>
                          <div className="col-span-1 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleRemoveCommand(index)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="p-4 border-t bg-muted/10 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  <span>Register Device</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
