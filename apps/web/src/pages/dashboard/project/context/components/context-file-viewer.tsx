import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Check,
  Clock,
  Copy,
  Edit,
  ExternalLink,
  FileCode2,
  Trash2,
} from "lucide-react";
import type { GetContextFileResponseType } from "@repo/types/endpoints/fiware/context-file";

type Props = {
  project: string;
  contextFile: GetContextFileResponseType;
  onEdit: () => void;
  onDelete: () => void;
};

export function ContextFileViewer({
  project,
  contextFile,
  onEdit,
  onDelete,
}: Props) {
  const [hasCopied, setHasCopied] = useState(false);

  const formattedJson = JSON.stringify(contextFile.file, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedJson);
      setHasCopied(true);
      toast.add({
        title: "Copied to clipboard",
        description: "JSON-LD context file content copied.",
        type: "success",
      });
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      toast.add({
        title: "Failed to copy",
        description: "Could not copy text to clipboard.",
        type: "error",
      });
    }
  };

  const rawUrl = `/api/fiware/context-file/${encodeURIComponent(project)}/context.jsonld`;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="space-y-5">
        {/* Action Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border bg-card text-card-foreground shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
              <FileCode2 className="size-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold tracking-tight text-foreground">
                  {contextFile.name || `Project Context File`}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  <span>v{contextFile.version}</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                {contextFile.description || "JSON-LD context file defining FIWARE NGSI-LD entities."}
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={rawUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 text-xs")}
            >
              <ExternalLink className="size-3.5" />
              <span>Raw JSON-LD</span>
            </a>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="gap-1.5 text-xs"
            >
              <Edit className="size-3.5" />
              <span>Update</span>
            </Button>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="gap-1.5 text-xs"
            >
              <Trash2 className="size-3.5" />
              <span>Delete</span>
            </Button>
          </div>
        </div>

        {/* Metadata Overview Cards */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-lg border bg-muted/20 flex items-center gap-3">
            <div className="p-2 rounded-md bg-background border text-muted-foreground">
              <Clock className="size-4" />
            </div>
            <div>
              <span className="text-muted-foreground text-[11px] block">Last Updated</span>
              <span className="font-semibold text-foreground">
                {new Date(contextFile.updatedAt).toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
          <div className="p-3.5 rounded-lg border bg-muted/20 flex items-center gap-3">
            <div className="p-2 rounded-md bg-background border text-muted-foreground">
              <Calendar className="size-4" />
            </div>
            <div>
              <span className="text-muted-foreground text-[11px] block">Created At</span>
              <span className="font-semibold text-foreground">
                {new Date(contextFile.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Code Viewer Container */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b">
            <span className="text-xs font-semibold text-muted-foreground font-mono">
              @context JSON-LD
            </span>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={handleCopy}
              className="gap-1 text-xs h-7"
            >
              {hasCopied ? (
                <>
                  <Check className="size-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5 text-muted-foreground" />
                  <span>Copy JSON</span>
                </>
              )}
            </Button>
          </div>

          <div className="p-4 overflow-x-auto max-h-[600px] overflow-y-auto">
            <pre className="font-mono text-xs text-foreground leading-relaxed whitespace-pre">
              {formattedJson}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

