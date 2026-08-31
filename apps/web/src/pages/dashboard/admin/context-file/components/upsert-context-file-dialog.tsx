import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Check, Code2, FileCode2, Loader2, Save } from "lucide-react";
import type {
  GetContextFileResponseType,
  UpsertContextFileBodyType,
} from "@repo/types/endpoints/fiware/context-file";
import LearnMore from "./learn-more";

const DEFAULT_CONTEXT_TEMPLATE = JSON.stringify(
  {
    "@context": {
      "type": "@type",
      "id": "@id",
      "ngsi-ld": "https://uri.etsi.org/ngsi-ld/",
      "fiware": "https://uri.fiware.org/ns/dataModels#",

      "Greenhouse": "fiware:AgriGreenhouse",
      "Sensor": "fiware:Device",
      "temperature": "fiware:temperature",
      "humidity": "fiware:humidity",
      "location": "fiware:location",
      "controlledAsset": "fiware:controlledAsset"
    }
  },
  null,
  2
);

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: GetContextFileResponseType | null;
  onSave: (body: UpsertContextFileBodyType) => Promise<void>;
};

function UpsertContextFileForm({
  initialData,
  onCancel,
  onSave,
}: {
  initialData?: GetContextFileResponseType | null;
  onCancel: () => void;
  onSave: (body: UpsertContextFileBodyType) => Promise<void>;
}) {
  const isEditing = Boolean(initialData);

  const [fileContent, setFileContent] = useState(() =>
    initialData?.file ? JSON.stringify(initialData.file, null, 2) : DEFAULT_CONTEXT_TEMPLATE
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormatJson = () => {
    try {
      const parsed: unknown = JSON.parse(fileContent);
      setFileContent(JSON.stringify(parsed, null, 2));
      setJsonError(null);
      toast.add({
        title: "JSON formatted",
        description: "Valid JSON-LD structure formatted successfully.",
        type: "success",
      });
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "Invalid JSON syntax";
      setJsonError(errMsg);
      toast.add({
        title: "Invalid JSON",
        description: errMsg,
        type: "error",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let parsedFile: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(fileContent);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error("The context file must be a valid JSON object.");
      }
      parsedFile = parsed as Record<string, unknown>;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Invalid JSON syntax";
      setJsonError(errMsg);
      toast.add({
        title: "Invalid JSON format",
        description: errMsg,
        type: "error",
      });
      return;
    }

    setJsonError(null);

    const payload: UpsertContextFileBodyType = {
      file: parsedFile,
    };

    try {
      setIsSubmitting(true);
      await onSave(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
            <FileCode2 className="size-5" />
          </div>
          <div>
            <DialogTitle>
              {isEditing ? "Update Global Context File" : "Create Global Context File"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the global JSON-LD mapping and ontologies used by FIWARE Orion-LD."
                : "Define the global JSON-LD @context ontologies, attributes, and schemas for FIWARE NGSI-LD."}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-3 text-xs">
        {/* JSON Content Editor */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <label className="font-medium text-foreground flex items-center gap-1.5">
              <Code2 className="size-3.5 text-primary" />
              <span>JSON-LD Content (@context)</span>
              <span className="text-destructive">*</span>
            </label>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleFormatJson}
              disabled={isSubmitting}
              className="gap-1 text-[11px] h-6"
            >
              <Check className="size-3" />
              <span>Validate JSON</span>
            </Button>
          </div>

          <textarea
            rows={14}
            value={fileContent}
            onChange={(e) => {
              setFileContent(e.target.value);
              if (jsonError) setJsonError(null);
            }}
            disabled={isSubmitting}
            required
            className="w-full font-mono text-[11px] p-3 rounded-lg border bg-muted/40 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed resize-y"
            placeholder="Paste or write your JSON-LD context definition here..."
            spellCheck={false}
          />

          {jsonError && (
            <p className="text-[11px] font-medium text-destructive mt-1">
              {jsonError}
            </p>
          )}
        </div>
        <LearnMore />
      </div>

      <DialogFooter className="gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="gap-1.5">
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="size-4" />
              <span>{isEditing ? "Update Context" : "Create Context"}</span>
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function UpsertContextFileDialog({
  open,
  onOpenChange,
  initialData,
  onSave,
}: Props) {
  const formKey = open ? (initialData ? String(initialData.updatedAt) : "create") : "closed";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {open && (
          <UpsertContextFileForm
            key={formKey}
            initialData={initialData}
            onCancel={() => onOpenChange(false)}
            onSave={onSave}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

