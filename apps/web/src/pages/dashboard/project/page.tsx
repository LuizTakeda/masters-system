import { Link, useParams } from "react-router";
import PageHeader from "../components/page-header";
import { ArrowRight, Cpu, FileCode2, FolderGit2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatProjectString } from "@/lib/utils";

export default function ProjectHomePage() {
  const { project } = useParams<{ project: string }>();

  if (!project) {
    return null;
  }

  const projectTitle = formatProjectString(project);

  return (
    <div>
      <PageHeader items={[{ label: projectTitle }]} />

      <div className="p-6 space-y-6 max-w-7xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground capitalize">
              {projectTitle} Workspace
            </h2>
            <FolderGit2 className="size-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            Manage IoT devices, telemetry, and NGSI-LD entities for this
            project.
          </p>
        </div>

        {/* Project Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col justify-between p-5 rounded-xl border bg-card text-card-foreground shadow-2xs space-y-4">
            <div className="space-y-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Cpu className="size-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">
                IoT Devices
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Provision hardware sensors, map MQTT telemetry attributes, and
                inspect live Context Broker entities.
              </p>
            </div>

            <Link
              to={`/dashboard/${encodeURIComponent(project)}/device`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-fit gap-1.5",
              )}
            >
              <span>Manage Devices</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="flex flex-col justify-between p-5 rounded-xl border bg-card text-card-foreground shadow-2xs space-y-4">
            <div className="space-y-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileCode2 className="size-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">
                Context File
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                View the global JSON-LD @context file, ontologies, and entity
                attribute mappings.
              </p>
            </div>

            <Link
              to={`/dashboard/${encodeURIComponent(project)}/context-file`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "w-fit gap-1.5",
              )}
            >
              <span>View Context File</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
