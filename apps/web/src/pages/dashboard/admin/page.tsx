import PageHeader from "../components/page-header";
import { Link } from "react-router";
import { ArrowRight, Server, Shield } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AdminHomePage() {
  return (
    <div>
      <PageHeader
        items={[
          { label: "Admin" },
        ]}
      />

      <div className="p-6 space-y-6 max-w-7xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              System Administration
            </h2>
            <Shield className="size-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            Manage global infrastructure, MQTT broker security, and system-wide configurations.
          </p>
        </div>

        {/* Administration Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col justify-between p-5 rounded-xl border bg-card text-card-foreground shadow-2xs space-y-4">
            <div className="space-y-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Server className="size-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">MQTT Broker</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Configure Dynamic Security, clients, roles, ACLs, and groups in the Mosquitto Broker.
              </p>
            </div>

            <Link
              to="/dashboard/admin/mqtt-broker"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit gap-1.5")}
            >
              <span>Access MQTT Broker</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

