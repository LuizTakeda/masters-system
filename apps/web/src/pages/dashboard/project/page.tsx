import { Link, useParams } from "react-router";
import PageHeader from "../components/page-header";
import { ArrowRight, FileCode2, FolderGit2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatProjectString } from "@/lib/utils";

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
            Manage FIWARE context files, smart data models, and NGSI-LD IoT entities for this project.
          </p>
        </div>

        {/* Project Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col justify-between p-5 rounded-xl border bg-card text-card-foreground shadow-2xs space-y-4">
            <div className="space-y-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileCode2 className="size-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">Context File</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Define and manage the JSON-LD @context file, ontologies, and entity attribute mappings.
              </p>
            </div>

            <Link
              to={`/dashboard/${encodeURIComponent(project)}/context`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit gap-1.5")}
            >
              <span>Access Context File</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}