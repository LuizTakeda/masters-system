import { useState } from "react";
import { useSearchParams } from "react-router";
import { useRoles } from "@/hooks/mqtt/use-roles";
import type { GetRolesResponseType } from "@repo/types/endpoints/mqtt/role";
import { RolesTable } from "./components/roles-table";
import { RolesPagination } from "./components/roles-pagination";
import { RoleDetailsSheet } from "./components/role-details-sheet";

type RoleItem = GetRolesResponseType["roles"][number];

const PAGE_SIZE = 10;

export default function RolePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const { roles, totalCount = 0, isLoading, isError } = useRoles({
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

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden">
        <RolesTable
          roles={roles}
          isLoading={isLoading}
          isError={isError}
          onSelectRole={handleOpenRole}
        />

        <RolesPagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          isLoading={isLoading}
          onPageChange={handlePageChange}
        />
      </div>

      <RoleDetailsSheet
        role={selectedRole}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </div>
  );
}