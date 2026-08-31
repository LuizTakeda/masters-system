import { useParams } from "react-router";
import PageHeader from "../components/page-header";
import { FolderGit2 } from "lucide-react";
import { formatProjectString } from "@/lib/utils";

export default function ProjectHomePage() {
  const { project } = useParams<{ project: string }>();

  if (!project) {
    return null;
  }

  return (
    <div>
      <PageHeader
        items={[
          { label: formatProjectString(project) },
        ]}
      />

      <div className="p-6 space-y-6 max-w-7xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-foreground capitalize">
              {formatProjectString(project)} Workspace
            </h2>
            <FolderGit2 className="size-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            Manage IoT devices, telemetry, and NGSI-LD entities for this project.
          </p>
        </div>

        {/* Project Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        </div>
      </div>
    </div>
  );
}