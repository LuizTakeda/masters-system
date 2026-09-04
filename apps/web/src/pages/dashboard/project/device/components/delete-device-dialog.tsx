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
import type { IotDeviceType } from "@repo/types/endpoints/iot-agent/device.endpoints";

type Props = {
  device: IotDeviceType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (deviceId: string) => Promise<void>;
};

export function DeleteDeviceDialog({
  device,
  open,
  onOpenChange,
  onConfirm,
}: Props) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!device) return;
    try {
      setIsDeleting(true);
      await onConfirm(device.device_id);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Device</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span>
              Are you sure you want to remove device{" "}
              <strong className="text-foreground font-semibold font-mono">
                {device?.device_id}
              </strong>
              {device?.entity_name && (
                <>
                  {" "}
                  (entity:{" "}
                  <code className="text-foreground font-semibold font-mono text-xs bg-muted px-1 py-0.5 rounded">
                    {device.entity_name}
                  </code>
                  )
                </>
              )}
              ?
            </span>
            <p className="text-xs text-muted-foreground pt-1">
              This action will unregister the device from the IoT Agent.
              Incoming telemetry for this device will no longer be processed.
            </p>
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
                <span>Delete Device</span>
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
