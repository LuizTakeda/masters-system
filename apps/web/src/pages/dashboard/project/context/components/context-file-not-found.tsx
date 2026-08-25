import { Button } from "@/components/ui/button";
import { FileCode2, Plus } from "lucide-react";
import LearnMore from "./learn-more";

type Props = {
  project: string;
  onOpen: () => void;
};

export default function ContextFileNotFound({ project, onOpen }: Props) {
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">

      <div className="relative overflow-hidden rounded-xl border border-dashed bg-card p-8 sm:p-12 text-card-foreground shadow-2xs">
        <div className="flex flex-col items-center text-center max-w-lg mx-auto space-y-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-2xs">
            <FileCode2 className="size-7" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold tracking-tight text-foreground">
              No Context File Configured
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Project <strong className="text-foreground font-semibold font-mono">{project}</strong> does not have an active JSON-LD @context file yet. Create one to enable semantic ontologies for NGSI-LD entities.
            </p>

            <LearnMore />
          </div>

          <Button
            type="button"
            onClick={onOpen}
            className="gap-2 text-xs mt-2"
          >
            <Plus className="size-4" />
            <span>Create Context File</span>
          </Button>
        </div>
      </div>
    </div>
  );
}