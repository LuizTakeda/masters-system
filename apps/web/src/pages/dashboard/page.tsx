import { useMemo } from "react";
import { Link } from "react-router";
import { useMe } from "@/hooks/use-me";
import PageHeader from "./components/page-header";
import { ArrowUpRight, FolderGit2, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function formatProjectName(context: string) {
  if (context === "system-admin") {
    return "System Admin";
  }
  return context.replace(/^project-/, "").toUpperCase();
}

export default function DashboardHomePage() {
  const { user, isLoading } = useMe();

  const contexts = useMemo(() => {
    if (!user) return [];

    const list: Array<{
      id: string;
      label: string;
      subLabel: string;
      to: string;
      isAdmin: boolean;
    }> = [];

    if (user.roles.includes("system-admin")) {
      list.push({
        id: "system-admin",
        label: "System Admin",
        subLabel: "Global Control Plane",
        to: "/dashboard/admin",
        isAdmin: true,
      });
    }

    const projects = user.groups.filter((str) => str.startsWith("project-"));
    for (const project of projects) {
      list.push({
        id: project,
        label: formatProjectName(project),
        subLabel: project,
        to: `/dashboard/${encodeURIComponent(project)}`,
        isAdmin: false,
      });
    }

    return list;
  }, [user]);

  return (
    <div>
      <PageHeader
        items={[
          { label: "Dashboard" },
        ]}
      />

      <div className="p-6 space-y-6 max-w-7xl">
        {/* Welcome Banner */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Select a workspace context.
          </p>
        </div>

        {/* Workspaces Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Available Contexts ({isLoading ? "..." : contexts.length})
            </h3>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : contexts.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground bg-card">
              <FolderGit2 className="size-8 mx-auto mb-2 opacity-50" />
              <h4 className="text-sm font-semibold text-foreground">No accessible contexts</h4>
              <p className="text-xs text-muted-foreground mt-1">
                You do not belong to any project groups or administration roles yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {contexts.map((ctx) => (
                <Link
                  key={ctx.id}
                  to={ctx.to}
                  className="group relative flex flex-col justify-between p-4 rounded-xl border bg-card text-card-foreground shadow-2xs hover:shadow-md hover:border-primary/50 hover:-translate-y-0.5 transition-all duration-150 cursor-pointer overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`flex size-10 items-center justify-center rounded-lg shadow-2xs transition-colors ${
                        ctx.isAdmin
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground group-hover:bg-primary/10 group-hover:text-primary"
                      }`}
                    >
                      {ctx.isAdmin ? (
                        <Shield className="size-5" />
                      ) : (
                        <FolderGit2 className="size-5" />
                      )}
                    </div>
                    <ArrowUpRight className="size-4 text-muted-foreground opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all text-primary" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block truncate">
                      {ctx.isAdmin ? "Administration" : "Project"}
                    </span>
                    <h4 className="font-bold text-sm tracking-tight text-foreground group-hover:text-primary transition-colors truncate">
                      {ctx.label}
                    </h4>
                    <p className="text-[11px] text-muted-foreground truncate font-mono">
                      {ctx.subLabel}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}