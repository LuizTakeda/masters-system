import { Link } from "react-router";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Activity,
  ArrowRight,
  ChartArea,
  Construction,
  Radio,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";

export default function MqttAnalyticsPage() {
  const upcomingFeatures = [
    {
      icon: Activity,
      title: "Real-time Message Rates",
      description: "Live charts of incoming and outgoing publish rates across all topics and QoS levels.",
    },
    {
      icon: Radio,
      title: "Connected Client Metrics",
      description: "Aggregated session statuses, packet transmission latency, and connection histories.",
    },
    {
      icon: ChartArea,
      title: "Bandwidth & Throughput",
      description: "Historical data transfer volume, broker memory usage, and topic distribution statistics.",
    },
    {
      icon: ShieldCheck,
      title: "Security & ACL Audits",
      description: "Detailed access logs for denied subscriptions and unauthorized publication attempts.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-base font-semibold tracking-tight text-foreground">Broker Analytics</h2>
        <p className="text-xs text-muted-foreground">Real-time metrics, throughput, and operational telemetry for Mosquitto.</p>
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
              <span>Work in Progress</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              Analytics Module is Under Development
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              We are building a real-time telemetry dashboard for monitoring broker health, topic throughput, active MQTT sessions, and security audits.
            </p>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <Link
              to="clients"
              className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-1.5")}
            >
              <User className="size-3.5" />
              <span>Manage Clients</span>
              <ArrowRight className="size-3.5" />
            </Link>
            <Link
              to="groups"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
            >
              <Users className="size-3.5" />
              <span>Manage Groups</span>
            </Link>
            <Link
              to="roles"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
            >
              <ShieldCheck className="size-3.5" />
              <span>Manage Roles & ACLs</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Previews Grid */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Upcoming Features & Metrics
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {upcomingFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="flex flex-col gap-2.5 p-4 rounded-lg border bg-muted/20 border-dashed"
              >
                <div className="flex size-8 items-center justify-center rounded-md bg-background border text-primary">
                  <Icon className="size-4" />
                </div>
                <div className="space-y-1">
                  <h5 className="text-xs font-semibold text-foreground">{feat.title}</h5>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}