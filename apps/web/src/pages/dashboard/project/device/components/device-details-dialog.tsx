import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Check,
  Code2,
  Copy,
  Cpu,
  FileCode,
  Radio,
  Terminal,
  Layers,
} from "lucide-react";
import type { IotDeviceType } from "@repo/types/endpoints/iot-agent/device.endpoints";

type Props = {
  device: IotDeviceType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultApiKey?: string;
};

export function DeviceDetailsDialog({
  device,
  open,
  onOpenChange,
  defaultApiKey = "",
}: Props) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "telemetry" | "attributes" | "raw"
  >("telemetry");

  if (!device) return null;

  const effectiveApiKey = device.apikey || defaultApiKey || "<api_key>";
  const mqttTopic = `/${effectiveApiKey}/${device.device_id}/attrs`;
  const mqttCmdTopic = `/${effectiveApiKey}/${device.device_id}/cmd`;

  // Sample telemetry payload using configured object_ids
  const samplePayloadObj: Record<string, unknown> = {};
  if (device.attributes && device.attributes.length > 0) {
    for (const attr of device.attributes) {
      if (
        attr.type.toLowerCase().includes("number") ||
        attr.type.toLowerCase().includes("float") ||
        attr.type.toLowerCase().includes("int")
      ) {
        samplePayloadObj[attr.object_id] = 25.5;
      } else if (attr.type.toLowerCase().includes("bool")) {
        samplePayloadObj[attr.object_id] = true;
      } else {
        samplePayloadObj[attr.object_id] = "active";
      }
    }
  } else {
    samplePayloadObj.temperature = 23.5;
    samplePayloadObj.humidity = 60;
  }
  const samplePayload = JSON.stringify(samplePayloadObj, null, 2);

  const mosquittoCommand = `mosquitto_pub -h localhost -p 1883 -t "${mqttTopic}" -m '${JSON.stringify(samplePayloadObj)}'`;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-3 border-b">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <Cpu className="size-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="font-mono text-base font-bold">
                  {device.device_id}
                </DialogTitle>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                  {device.protocol || "IoTA-JSON"}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-secondary-foreground border">
                  {device.transport || "MQTT"}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border">
                  {device.entity_type || "Device"}
                </span>
              </div>
              <DialogDescription className="text-xs">
                Context Broker Entity:{" "}
                <code className="text-foreground font-mono font-medium">
                  {device.entity_name ||
                    `urn:ngsi-ld:${device.entity_type || "Device"}:${device.device_id}`}
                </code>
              </DialogDescription>
            </div>
          </div>

          {/* Navigation Sub-tabs */}
          <div className="flex items-center gap-2 pt-3">
            <button
              type="button"
              onClick={() => setActiveTab("telemetry")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === "telemetry"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Radio className="size-3.5" />
              <span>MQTT Telemetry</span>
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
              <span>Attributes ({device.attributes?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("raw")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === "raw"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Code2 className="size-3.5" />
              <span>Raw JSON</span>
            </button>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === "telemetry" && (
            <div className="space-y-4">
              {/* Telemetry Topic Box */}
              <div className="rounded-lg border bg-secondary/30 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-foreground">
                  <span className="flex items-center gap-1.5">
                    <Radio className="size-3.5 text-emerald-500" />
                    MQTT Telemetry Topic
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(mqttTopic, "topic")}
                    className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
                  >
                    {copiedKey === "topic" ? (
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
                <div className="font-mono text-xs font-semibold bg-background p-2 rounded-md border text-foreground select-all">
                  {mqttTopic}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Publish sensor telemetry formatted as a JSON object to this
                  topic on the Mosquitto broker.
                </p>
              </div>

              {/* Sample Payload */}
              <div className="rounded-lg border bg-muted/20 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-foreground">
                  <span className="flex items-center gap-1.5">
                    <FileCode className="size-3.5 text-primary" />
                    Expected Telemetry Payload (JSON)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(samplePayload, "payload")}
                    className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
                  >
                    {copiedKey === "payload" ? (
                      <>
                        <Check className="size-3 text-emerald-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="font-mono text-xs bg-background p-3 rounded-md border text-foreground overflow-x-auto">
                  {samplePayload}
                </pre>
              </div>

              {/* Mosquitto pub test snippet */}
              <div className="rounded-lg border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-foreground">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="size-3.5 text-primary" />
                    CLI Test Command (Mosquitto)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(mosquittoCommand, "cli")}
                    className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
                  >
                    {copiedKey === "cli" ? (
                      <>
                        <Check className="size-3 text-emerald-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" />
                        <span>Copy CLI</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="font-mono text-xs bg-muted/60 p-3 rounded-md border text-foreground overflow-x-auto whitespace-pre-wrap break-all">
                  {mosquittoCommand}
                </pre>
              </div>

              {/* Commands Topic (if commands exist) */}
              {device.commands && device.commands.length > 0 && (
                <div className="rounded-lg border bg-amber-500/5 border-amber-500/20 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-amber-600 dark:text-amber-400">
                    <span className="flex items-center gap-1.5">
                      <Terminal className="size-3.5" />
                      Commands Topic Subscription
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(mqttCmdTopic, "cmdTopic")}
                      className="text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 text-xs"
                    >
                      {copiedKey === "cmdTopic" ? (
                        <>
                          <Check className="size-3 text-emerald-500" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-xs font-semibold bg-background p-2 rounded-md border text-foreground select-all">
                    {mqttCmdTopic}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Your ESP32 firmware should subscribe to this topic to
                    receive actuator commands.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "attributes" && (
            <div className="space-y-6">
              {/* Dynamic Mapped Attributes */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Dynamic Attributes (Mapped from MQTT)
                </h4>
                {!device.attributes || device.attributes.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic bg-muted/20 p-3 rounded-md border">
                    No dynamic attributes mapped. Telemetry keys will follow
                    default schema or service group defaults.
                  </p>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="text-left font-medium p-2.5 text-muted-foreground">
                            Protocol Key (object_id)
                          </th>
                          <th className="text-left font-medium p-2.5 text-muted-foreground">
                            Entity Attribute (name)
                          </th>
                          <th className="text-left font-medium p-2.5 text-muted-foreground">
                            Data Type
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {device.attributes.map((attr, idx) => (
                          <tr
                            key={`${attr.object_id}-${idx}`}
                            className="hover:bg-muted/20"
                          >
                            <td className="p-2.5 font-mono font-semibold text-primary">
                              {attr.object_id}
                            </td>
                            <td className="p-2.5 font-mono text-foreground">
                              {attr.name}
                            </td>
                            <td className="p-2.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-secondary-foreground border">
                                {attr.type}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Static Attributes */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Static Attributes
                </h4>
                {!device.static_attributes ||
                device.static_attributes.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic bg-muted/20 p-3 rounded-md border">
                    No static attributes defined.
                  </p>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="text-left font-medium p-2.5 text-muted-foreground">
                            Attribute Name
                          </th>
                          <th className="text-left font-medium p-2.5 text-muted-foreground">
                            Type
                          </th>
                          <th className="text-left font-medium p-2.5 text-muted-foreground">
                            Value
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {device.static_attributes.map((attr, idx) => (
                          <tr
                            key={`${attr.name}-${idx}`}
                            className="hover:bg-muted/20"
                          >
                            <td className="p-2.5 font-mono font-semibold text-foreground">
                              {attr.name}
                            </td>
                            <td className="p-2.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-secondary-foreground border">
                                {attr.type}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-muted-foreground">
                              {typeof attr.value === "object"
                                ? JSON.stringify(attr.value)
                                : String(attr.value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Commands */}
              {device.commands && device.commands.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Configured Commands
                  </h4>
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="text-left font-medium p-2.5 text-muted-foreground">
                            Command Name
                          </th>
                          <th className="text-left font-medium p-2.5 text-muted-foreground">
                            Type
                          </th>
                          <th className="text-left font-medium p-2.5 text-muted-foreground">
                            Value Expression
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {device.commands.map((cmd, idx) => (
                          <tr
                            key={`${cmd.name}-${idx}`}
                            className="hover:bg-muted/20"
                          >
                            <td className="p-2.5 font-mono font-semibold text-foreground">
                              {cmd.name}
                            </td>
                            <td className="p-2.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                                {cmd.type || "command"}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-muted-foreground">
                              {cmd.value || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "raw" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-foreground">
                <span className="text-muted-foreground">
                  Complete Device Registration Object
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(JSON.stringify(device, null, 2), "rawJson")
                  }
                  className="text-primary hover:underline inline-flex items-center gap-1 text-xs"
                >
                  {copiedKey === "rawJson" ? (
                    <>
                      <Check className="size-3 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" />
                      <span>Copy Full JSON</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 rounded-lg bg-muted/40 font-mono text-xs border overflow-x-auto text-foreground">
                {JSON.stringify(device, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/10 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
