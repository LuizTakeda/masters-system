import { useState } from "react";
import { useSearchParams } from "react-router";
import { useGroups } from "@/hooks/mqtt/use-groups";
import { useRoleNames } from "@/hooks/mqtt/use-roles";
import { useClientNames } from "@/hooks/mqtt/use-clients";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { GetGroupsResponseType } from "@repo/types/endpoints/mqtt/group";
import type { HttpErrorType } from "@repo/types/commons";
import { GroupsTable } from "./components/groups-table";
import { TablePagination } from "../components/table-pagination";
import { GroupDetailsDialog } from "./components/group-details-dialog";
import { DeleteGroupDialog } from "./components/delete-group-dialog";
import { CreateGroupDialog } from "./components/create-group-dialog";

type GroupItem = NonNullable<GetGroupsResponseType["groups"]>[number];

const PAGE_SIZE = 10;

export default function GroupsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupItem | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<GroupItem | null>(null);

  // Preload role names and client names in SWR cache for instant dialog opening
  useRoleNames();
  useClientNames();

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const { groups, totalCount = 0, isLoading, isError, deleteGroup } = useGroups({
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

  const handleOpenGroup = (group: GroupItem) => {
    setSelectedGroup(group);
    setIsDetailsOpen(true);
  };

  const handleOpenDelete = (group: GroupItem) => {
    setGroupToDelete(group);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async (group: GroupItem) => {
    try {
      const response = await deleteGroup(group.groupname);
      toast.add({
        title: "Group deleted successfully",
        description: response?.message || `Group "${group.groupname}" has been deleted.`,
        type: "success",
      });
    } catch (error) {
      const err = error as Partial<HttpErrorType>;
      toast.add({
        title: "Failed to delete group",
        description: err.message || "Could not delete the group.",
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action bar above table */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">Groups</h2>
          <p className="text-xs text-muted-foreground">Manage client groups.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1.5">
          <Plus className="size-4" />
          <span>Create Group</span>
        </Button>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden">
        <GroupsTable
          groups={groups}
          isLoading={isLoading}
          isError={isError}
          onSelectGroup={handleOpenGroup}
          onDeleteGroup={handleOpenDelete}
        />

        <TablePagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          isLoading={isLoading}
          onPageChange={handlePageChange}
          resourceName={{ singular: "group", plural: "groups" }}
        />
      </div>

      <GroupDetailsDialog
        group={selectedGroup}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      <CreateGroupDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      <DeleteGroupDialog
        group={groupToDelete}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
