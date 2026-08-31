import { ExternalLink } from "lucide-react";

export default function LearnMore() {
  return (
    <div className="pt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
      <span className="text-[11px] font-medium">Learn more:</span>
      <a
        href="https://ngsi-ld-tutorials.readthedocs.io/en/latest/understanding-%40context.html"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
      >
        <span>@context Tutorial</span>
        <ExternalLink className="size-3" />
      </a>
      <span className="text-muted-foreground/30">•</span>
      <a
        href="https://ngsi-ld.org/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
      >
        <span>NGSI-LD Spec</span>
        <ExternalLink className="size-3" />
      </a>
      <span className="text-muted-foreground/30">•</span>
      <a
        href="https://fiware.org/smart-data-models/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
      >
        <span>Smart Data Models</span>
        <ExternalLink className="size-3" />
      </a>
    </div>
  );
}
