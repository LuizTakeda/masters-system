import { Construction, Cpu, HardDrive, Network, Radio } from "lucide-react";

export default function DevicesPlaceholderPage() {
  const upcomingFeatures = [
    {
      icon: Cpu,
      title: "Device Provisioning",
      description:
        "Register devices with protocol bindings, endpoints, and mapped attributes directly into the IoT Agent.",
    },
    {
      icon: HardDrive,
      title: "Static & Dynamic Attributes",
      description:
        "Map MQTT JSON keys to standard NGSI-LD properties, units of measurement, and static values.",
    },
    {
      icon: Radio,
      title: "Commands & Actuators",
      description:
        "Configure bidirectional command endpoints to trigger relays, motors, and smart actuators.",
    },
    {
      icon: Network,
      title: "Context Source Link",
      description:
        "Automatic registration of device endpoints directly inside the Orion-LD Context Broker.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          IoT Devices
        </h2>
        <p className="text-xs text-muted-foreground">
          Manage hardware devices, attributes, and telemetry endpoints.
        </p>
      </div>

      {/* Main WIP Banner Card */}
      <div className="relative overflow-hidden rounded-xl border bg-card p-8 text-card-foreground shadow-xs">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 size-48 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center max-w-xl mx-auto space-y-4">
          <div className="relative flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
            <Construction className="size-7 animate-pulse" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <span className="size-1.5 rounded-full bg-amber-500 animate-ping" />
              <span>Coming Soon in Next Subtask</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              Devices Management View
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This module will allow administrators and users to register ESP32
              devices, configure JSON attribute mappings, and monitor live
              device registrations.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {upcomingFeatures.map((feat) => {
          const Icon = feat.icon;
          return (
            <div
              key={feat.title}
              className="flex items-start gap-3 rounded-lg border bg-card p-4 text-card-foreground shadow-xs"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                <Icon className="size-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">
                  {feat.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feat.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
