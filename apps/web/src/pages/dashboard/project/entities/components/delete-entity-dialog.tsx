import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";
import type { NgsiLdEntityType } from "@repo/types/endpoints/ngsi-ld/entities.endpoints";

type Props = {
  entity: NgsiLdEntityType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (entityId: string) => Promise<void>;
};

export function DeleteEntityDialog({
  entity,
  open,
  onOpenChange,
  onConfirm,
}: Props) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!entity) return;
    try {
      setIsDeleting(true);
      await onConfirm(entity.id);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Entity</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span>
              Are you sure you want to permanently delete entity{" "}
              <strong className="text-foreground font-semibold font-mono">
                {entity?.id}
              </strong>
              ?
            </span>
            <br />
            <span className="text-xs text-muted-foreground">
              This action will remove the entity and all associated properties
              from the Context Broker. This action cannot be undone.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              void handleConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="size-4" />
                <span>Delete</span>
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
