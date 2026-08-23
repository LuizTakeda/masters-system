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
import type { GetRolesResponseType } from "@repo/types/endpoints/mqtt/role";

type RoleItem = GetRolesResponseType["roles"][number];

type Props = {
  role: RoleItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (role: RoleItem) => Promise<void>;
};

export function DeleteRoleDialog({
  role,
  open,
  onOpenChange,
  onConfirm,
}: Props) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!role) return;
    try {
      setIsDeleting(true);
      await onConfirm(role);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Role</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the role{" "}
            <strong className="text-foreground font-semibold">
              {role?.rolename}
            </strong>
            ? This action cannot be undone and will permanently remove all associated ACL permissions.
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
