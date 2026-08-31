import { useState } from "react";
import { toast } from "@/components/ui/toast";
import { useContextFile } from "@/hooks/fiware/use-context-file";
import PageHeader from "@/pages/dashboard/components/page-header";
import { Loader2 } from "lucide-react";
import type { HttpErrorType } from "@repo/types/commons";
import type { UpsertContextFileBodyType } from "@repo/types/endpoints/fiware/context-file";
import { ContextFileViewer } from "./components/context-file-viewer";
import { UpsertContextFileDialog } from "./components/upsert-context-file-dialog";
import { DeleteContextFileDialog } from "./components/delete-context-file-dialog";
import ContextFileNotFound from "./components/context-file-not-found";

export default function AdminContextFilePage() {
  const {
    contextFile,
    isLoading,
    upsertContextFile,
    deleteContextFile,
  } = useContextFile();

  const [isUpsertOpen, setIsUpsertOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleSave = async (body: UpsertContextFileBodyType) => {
    try {
      const res = await upsertContextFile(body);
      toast.add({
        title: "Context file saved",
        description: res?.message || "FIWARE global context file saved successfully.",
        type: "success",
      });
      setIsUpsertOpen(false);
    } catch (error) {
      const err = error as Partial<HttpErrorType>;
      toast.add({
        title: "Failed to save context file",
        description: err.message || "Could not save the context file.",
        type: "error",
      });
      throw error;
    }
  };

  const handleDelete = async () => {
    try {
      const res = await deleteContextFile();
      toast.add({
        title: "Context file deleted",
        description: res?.message || "FIWARE global context file was removed.",
        type: "success",
      });
      setIsDeleteOpen(false);
    } catch (error) {
      const err = error as Partial<HttpErrorType>;
      toast.add({
        title: "Failed to delete context file",
        description: err.message || "Could not delete the context file.",
        type: "error",
      });
      throw error;
    }
  };

  if (isLoading) {
    return (
      <main>
        <PageHeader
          items={[
            { label: "Admin", to: "/dashboard/admin" },
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

  return (
    <div>
      <PageHeader
        items={[
          { label: "Admin", to: "/dashboard/admin" },
          { label: "Context File" },
        ]}
      />

      {contextFile ? (
        <ContextFileViewer
          contextFile={contextFile}
          onEdit={() => setIsUpsertOpen(true)}
          onDelete={() => setIsDeleteOpen(true)}
        />
      ) : (
        <ContextFileNotFound
          onOpen={() => setIsUpsertOpen(true)}
        />
      )}

      {/* Upsert (Create / Edit) Dialog */}
      <UpsertContextFileDialog
        open={isUpsertOpen}
        onOpenChange={setIsUpsertOpen}
        initialData={contextFile}
        onSave={handleSave}
      />

      {/* Delete Confirmation Alert Dialog */}
      <DeleteContextFileDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
      />
    </div>
  );
}

