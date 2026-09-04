import { NavLink, Outlet } from "react-router";
import PageHeader from "../../components/page-header";
import { Cpu, Layers } from "lucide-react";

const tabs = [
  { to: "services", label: "Services", icon: Layers, end: false },
  { to: "devices", label: "Devices", icon: Cpu, end: false },
];

export default function IotAgentJsonLayout() {
  return (
    <div>
      <PageHeader
        items={[
          { label: "Admin", to: "/dashboard/admin" },
          { label: "IoT Agent JSON" },
        ]}
      />

      <div className="px-4 py-2 bg-secondary">
        <nav className="inline-flex h-9 items-center gap-1 rounded-lg bg-muted/70 p-1 text-muted-foreground">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-md transition-all ${
                    isActive
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "hover:text-foreground hover:bg-background/40"
                  }`
                }
              >
                <Icon className="size-4" />
                <span>{tab.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4">
        <Outlet />
      </div>
    </div>
  );
}
