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
import type { IotServiceGroupType } from "@repo/types/endpoints/iot-agent/service.endpoints";

type Props = {
  service: IotServiceGroupType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (
    service: IotServiceGroupType,
    deleteDevices: boolean,
  ) => Promise<void>;
};

export function DeleteServiceDialog({
  service,
  open,
  onOpenChange,
  onConfirm,
}: Props) {
  const [deleteDevices, setDeleteDevices] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!service) return;
    try {
      setIsDeleting(true);
      await onConfirm(service, deleteDevices);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Service Group</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <span>
              Are you sure you want to delete the service group with API Key{" "}
              <strong className="text-foreground font-semibold font-mono">
                {service?.apikey}
              </strong>{" "}
              and resource{" "}
              <code className="text-foreground font-semibold font-mono text-xs bg-muted px-1 py-0.5 rounded">
                {service?.resource}
              </code>
              ?
            </span>

            <label className="flex items-center gap-2 pt-2 cursor-pointer select-none text-xs text-foreground">
              <input
                type="checkbox"
                checked={deleteDevices}
                onChange={(e) => setDeleteDevices(e.target.checked)}
                className="size-4 rounded border-input text-primary focus:ring-primary/20 accent-primary"
              />
              <span>
                Also remove all devices registered under this service group
              </span>
            </label>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="gap-2"
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
