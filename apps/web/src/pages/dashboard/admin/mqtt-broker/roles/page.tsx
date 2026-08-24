import { useState } from "react";
import { useSearchParams } from "react-router";
import { useRoles } from "@/hooks/mqtt/use-roles";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { GetRolesResponseType } from "@repo/types/endpoints/mqtt/role";
import type { HttpErrorType } from "@repo/types/commons";
import { RolesTable } from "./components/roles-table";
import { RolesPagination } from "./components/roles-pagination";
import { RoleDetailsDialog } from "./components/role-details-dialog";
import { DeleteRoleDialog } from "./components/delete-role-dialog";
import { CreateRoleDialog } from "./components/create-role-dialog";

type RoleItem = GetRolesResponseType["roles"][number];

const PAGE_SIZE = 10;

export default function RolePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<RoleItem | null>(null);

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const { roles, totalCount = 0, isLoading, isError, deleteRole } = useRoles({
    count: PAGE_SIZE,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(newPage));
      return next;
    });
  };

  const handleOpenRole = (role: RoleItem) => {
    setSelectedRole(role);
    setIsOpen(true);
  };

  const handleOpenDelete = (role: RoleItem) => {
    setRoleToDelete(role);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async (role: RoleItem) => {
    try {
      const response = await deleteRole(role.rolename);
      toast.add({
        title: "Role deleted successfully",
        description: response?.message || `Role "${role.rolename}" has been deleted.`,
        type: "success",
      });
    } catch (error) {
      const err = error as Partial<HttpErrorType>;
      toast.add({
        title: "Failed to delete role",
        description: err.message || "Could not delete the role.",
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action bar above table */}
      <div className="flex items-center justify-end">
        <Button onClick={() => setIsCreateOpen(true)} className="gap-1.5">
          <Plus className="size-4" />
          <span>Create Role</span>
        </Button>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden">
        <RolesTable
          roles={roles}
          isLoading={isLoading}
          isError={isError}
          onSelectRole={handleOpenRole}
          onDeleteRole={handleOpenDelete}
        />

        <RolesPagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          isLoading={isLoading}
          onPageChange={handlePageChange}
        />
      </div>

      <RoleDetailsDialog
        role={selectedRole}
        open={isOpen}
        onOpenChange={setIsOpen}
      />

      <CreateRoleDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      <DeleteRoleDialog
        role={roleToDelete}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}