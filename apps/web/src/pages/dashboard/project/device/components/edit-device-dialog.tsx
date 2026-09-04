import { useState, useEffect } from "react";
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
import {
  Cpu,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Sliders,
  Trash2,
} from "lucide-react";
import type {
  IotDeviceAttributeType,
  IotDeviceCommandType,
  IotDeviceStaticAttributeType,
  IotDeviceType,
  UpdateDeviceBodyType,
} from "@repo/types/endpoints/iot-agent/device.endpoints";
import type { HttpErrorType } from "@repo/types/commons";

type Props = {
  device: IotDeviceType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (deviceId: string, body: UpdateDeviceBodyType) => Promise<void>;
};

export function EditDeviceDialog({
  device,
  open,
  onOpenChange,
  onConfirm,
}: Props) {
  const [entityName, setEntityName] = useState("");
  const [entityType, setEntityType] = useState("");
  const [transport, setTransport] = useState("");
  const [apikey, setApikey] = useState("");
  const [timezone, setTimezone] = useState("");
  const [endpoint, setEndpoint] = useState("");

  const [attributes, setAttributes] = useState<IotDeviceAttributeType[]>([]);
  const [staticAttributes, setStaticAttributes] = useState<
    IotDeviceStaticAttributeType[]
  >([]);
  const [commands, setCommands] = useState<IotDeviceCommandType[]>([]);

  const [activeTab, setActiveTab] = useState<
    "general" | "attributes" | "advanced"
  >("general");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (device) {
      setEntityName(device.entity_name || "");
      setEntityType(device.entity_type || "Device");
      setTransport(device.transport || "MQTT");
      setApikey(device.apikey || "");
      setTimezone(device.timezone || "America/Sao_Paulo");
      setEndpoint(device.endpoint || "");
      setAttributes(
        device.attributes && device.attributes.length > 0
          ? [...device.attributes]
          : [],
      );
      setStaticAttributes(
        device.static_attributes && device.static_attributes.length > 0
          ? [...device.static_attributes]
          : [],
      );
      setCommands(
        device.commands && device.commands.length > 0
          ? [...device.commands]
          : [],
      );
      setActiveTab("general");
    }
  }, [device]);

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
    if (!device) return;

    const cleanAttributes = attributes.filter(
      (a) => a.object_id.trim() && a.name.trim(),
    );

    const cleanStaticAttributes = staticAttributes.filter(
      (sa) => sa.name.trim() && sa.value !== "",
    );

    const cleanCommands = commands.filter((c) => c.name.trim());

    const payload: UpdateDeviceBodyType = {
      entity_name: entityName.trim() || undefined,
      entity_type: entityType.trim() || undefined,
      transport: transport.trim() || undefined,
      apikey: apikey.trim() || undefined,
      timezone: timezone.trim() || undefined,
      endpoint: endpoint.trim() || undefined,
      attributes: cleanAttributes,
      static_attributes: cleanStaticAttributes,
      commands: cleanCommands,
    };

    try {
      setIsSubmitting(true);
      await onConfirm(device.device_id, payload);
      toast.add({
        title: "Device updated",
        description: `Device "${device.device_id}" updated successfully.`,
        type: "success",
      });
      onOpenChange(false);
    } catch (error) {
      const err = error as Partial<HttpErrorType>;
      toast.add({
        title: "Failed to update device",
        description: err?.message || "Could not update device configuration.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!device) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="p-6 pb-3 border-b">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                <Pencil className="size-5" />
              </div>
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <span>Edit Device:</span>
                  <code className="font-mono text-sm">{device.device_id}</code>
                </DialogTitle>
                <DialogDescription>
                  Update attribute mappings, endpoints, and telemetry
                  definitions.
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
                  {/* Entity Name */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label
                      htmlFor="edit-entity-name"
                      className="text-xs font-medium text-foreground"
                    >
                      Context Broker Entity Name
                    </label>
                    <Input
                      id="edit-entity-name"
                      value={entityName}
                      onChange={(e) => setEntityName(e.target.value)}
                      placeholder="urn:ngsi-ld:Device:..."
                      className="font-mono text-xs"
                    />
                  </div>

                  {/* Entity Type */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="edit-entity-type"
                      className="text-xs font-medium text-foreground"
                    >
                      Entity Type
                    </label>
                    <Input
                      id="edit-entity-type"
                      value={entityType}
                      onChange={(e) => setEntityType(e.target.value)}
                      placeholder="Device"
                      className="text-xs font-mono"
                    />
                  </div>

                  {/* Transport */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="edit-transport"
                      className="text-xs font-medium text-foreground"
                    >
                      Transport
                    </label>
                    <Input
                      id="edit-transport"
                      value={transport}
                      onChange={(e) => setTransport(e.target.value)}
                      placeholder="MQTT"
                      className="text-xs font-mono"
                    />
                  </div>

                  {/* API Key */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="edit-apikey"
                      className="text-xs font-medium text-foreground"
                    >
                      API Key
                    </label>
                    <Input
                      id="edit-apikey"
                      value={apikey}
                      onChange={(e) => setApikey(e.target.value)}
                      placeholder="API Key"
                      className="font-mono text-xs"
                    />
                  </div>

                  {/* Timezone */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="edit-timezone"
                      className="text-xs font-medium text-foreground"
                    >
                      Timezone
                    </label>
                    <Input
                      id="edit-timezone"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      placeholder="America/Sao_Paulo"
                      className="text-xs font-mono"
                    />
                  </div>

                  {/* Endpoint */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label
                      htmlFor="edit-endpoint"
                      className="text-xs font-medium text-foreground"
                    >
                      Command Push Endpoint (Optional)
                    </label>
                    <Input
                      id="edit-endpoint"
                      value={endpoint}
                      onChange={(e) => setEndpoint(e.target.value)}
                      placeholder="http://..."
                      className="font-mono text-xs"
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
                      Map MQTT keys to Orion-LD entity attributes.
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
                    No attributes configured.
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
                            placeholder="object_id"
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
                            placeholder="name"
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
                        Fixed metadata published with the entity.
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
                              placeholder="Name"
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
                              placeholder="Value"
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
                        Commands that can be triggered on the device.
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
                              placeholder="Command Name"
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
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Pencil className="size-4" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
