import { useState } from "react";
import { useSearchParams } from "react-router";
import { useClients } from "@/hooks/mqtt/use-clients";
import { useRoleNames } from "@/hooks/mqtt/use-roles";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { GetClientsResponseType } from "@repo/types/endpoints/mqtt/client";
import type { HttpErrorType } from "@repo/types/commons";
import { ClientsTable } from "./components/clients-table";
import { ClientsPagination } from "./components/clients-pagination";
import { ClientDetailsDialog } from "./components/client-details-dialog";
import { DeleteClientDialog } from "./components/delete-client-dialog";
import { CreateClientDialog } from "./components/create-client-dialog";

type ClientItem = GetClientsResponseType["clients"][number];

const PAGE_SIZE = 10;

export default function ClientsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientItem | null>(null);

  // Preload role names in SWR cache for instant opening of Create/Edit dialogs
  useRoleNames();

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const { clients, totalCount = 0, isLoading, isError, deleteClient } = useClients({
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

  const handleOpenClient = (client: ClientItem) => {
    setSelectedClient(client);
    setIsDetailsOpen(true);
  };

  const handleOpenDelete = (client: ClientItem) => {
    setClientToDelete(client);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async (client: ClientItem) => {
    try {
      const response = await deleteClient(client.username);
      toast.add({
        title: "Client deleted successfully",
        description: response?.message || `Client "${client.username}" has been deleted.`,
        type: "success",
      });
    } catch (error) {
      const err = error as Partial<HttpErrorType>;
      toast.add({
        title: "Failed to delete client",
        description: err.message || "Could not delete the client.",
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action bar above table */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">Clients</h2>
          <p className="text-xs text-muted-foreground">Manage MQTT client credentials, active sessions, and permissions.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-1.5">
          <Plus className="size-4" />
          <span>Create Client</span>
        </Button>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden">
        <ClientsTable
          clients={clients}
          isLoading={isLoading}
          isError={isError}
          onSelectClient={handleOpenClient}
          onDeleteClient={handleOpenDelete}
        />

        <ClientsPagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          isLoading={isLoading}
          onPageChange={handlePageChange}
        />
      </div>

      <ClientDetailsDialog
        client={selectedClient}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />

      <CreateClientDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      <DeleteClientDialog
        client={clientToDelete}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}