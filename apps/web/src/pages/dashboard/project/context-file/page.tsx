import { useState } from "react";
import { useParams } from "react-router";
import PageHeader from "@/pages/dashboard/components/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn, formatProjectString } from "@/lib/utils";
import { usePublicContextFile } from "@/hooks/fiware/use-context-file";
import {
  Check,
  Copy,
  ExternalLink,
  FileCode2,
  HelpCircle,
  Loader2,
} from "lucide-react";

export default function ProjectContextFilePage() {
  const { project } = useParams<{ project: string }>();
  const { rawContext, isLoading } = usePublicContextFile();
  const [hasCopied, setHasCopied] = useState(false);

  if (!project) {
    return null;
  }

  const projectTitle = formatProjectString(project);
  const formattedJson = rawContext ? JSON.stringify(rawContext, null, 2) : "";
  const rawUrl = "/api/fiware/context-file/context.jsonld";

  const handleCopy = async () => {
    if (!formattedJson) return;
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

  if (isLoading) {
    return (
      <main>
        <PageHeader
          items={[
            { label: projectTitle, to: `/dashboard/${encodeURIComponent(project)}` },
            { label: "Context File" },
          ]}
        />
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
          <div className="flex flex-col items-center justify-center p-16 space-y-3">
            <Loader2 className="size-8 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Loading context file...</p>
          </div>
        </div>
      </main>
    );
  }

  console.log(rawContext);

  return (
    <div>
      <PageHeader
        items={[
          { label: projectTitle, to: `/dashboard/${encodeURIComponent(project)}` },
          { label: "Context File" },
        ]}
      />

      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {rawContext ? (
          <div className="space-y-5">
            {/* Header Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border bg-card text-card-foreground shadow-2xs">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                  <FileCode2 className="size-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold tracking-tight text-foreground">
                      Global Context File
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                      <span>Public JSON-LD</span>
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                    Shared JSON-LD @context schemas, ontologies, and entity attribute mappings used across FIWARE Orion-LD.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
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
                  onClick={handleCopy}
                  className="gap-1.5 text-xs"
                >
                  {hasCopied ? (
                    <>
                      <Check className="size-3.5 text-emerald-500" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </Button>
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

            {/* Explanatory Info Card */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <HelpCircle className="size-4 text-primary" />
                <span>About FIWARE NGSI-LD @context</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                In NGSI-LD, the <code className="text-foreground font-mono bg-muted px-1 rounded">@context</code> provides unique URIs for entity types and attributes. When creating or querying entities in this project, this context file is referenced in the header.
              </p>
              <div className="flex items-center gap-3 pt-1 text-[11px]">
                <a
                  href="https://smartdatamodels.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                >
                  <span>Smart Data Models Guidelines</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="relative overflow-hidden rounded-xl border border-dashed bg-card p-8 sm:p-12 text-card-foreground shadow-2xs">
            <div className="flex flex-col items-center text-center max-w-lg mx-auto space-y-4">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground border shadow-2xs">
                <FileCode2 className="size-7" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold tracking-tight text-foreground">
                  No Global Context File Configured
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  An administrator has not published the global JSON-LD @context file yet. Once published, you will be able to view all shared entity schemas and ontologies here.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}