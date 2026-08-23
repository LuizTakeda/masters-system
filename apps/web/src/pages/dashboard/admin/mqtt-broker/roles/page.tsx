import { useState } from "react";
import { useSearchParams } from "react-router";
import { useRoles } from "@/hooks/mqtt/use-roles";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Info, Shield, ShieldCheck } from "lucide-react";
import type { GetRolesResponseType } from "@repo/types/endpoints/mqtt/role";

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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-48" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-8 ml-auto rounded-md" />
                  </TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  Erro ao carregar roles.
                </TableCell>
              </TableRow>
            ) : !roles || roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  Nenhuma role encontrada.
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.rolename} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium flex items-center gap-2">
                    <Shield className="size-4 text-muted-foreground shrink-0" />
                    <span>{role.rolename}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {role.textdescription || <span className="italic text-muted-foreground/50">Sem descrição</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleOpenRole(role)}
                      title="Ver detalhes"
                    >
                      <Info className="size-4" />
                      <span className="sr-only">Ver detalhes de {role.rolename}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Paginação */}
        <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground bg-muted/20">
          <div>
            Total: <span className="font-medium text-foreground">{totalCount}</span> {totalCount === 1 ? "role" : "roles"}
          </div>

          <div className="flex items-center gap-2">
            <span>
              Página {page} de {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1 || isLoading}
              >
                <ChevronLeft className="size-3.5" />
                <span className="sr-only">Página anterior</span>
              </Button>
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages || isLoading}
              >
                <ChevronRight className="size-3.5" />
                <span className="sr-only">Próxima página</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sheet de Detalhes da Role */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-6 overflow-y-auto">
          {selectedRole && (
            <div className="space-y-6">
              <SheetHeader className="p-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <SheetTitle className="truncate">{selectedRole.rolename}</SheetTitle>
                    <SheetDescription className="truncate">
                      {selectedRole.textdescription || "Sem descrição definida."}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-4 text-sm">
                <div className="rounded-md border p-3 bg-muted/20 space-y-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Configurações Gerais
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>Wildcard Subscriptions:</span>
                    <span className="font-medium">
                      {selectedRole.allowwildcardsubs ? "Permitido" : "Padrão / Desabilitado"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Regras de ACL ({selectedRole.acls?.length ?? 0})
                    </span>
                  </div>

                  {!selectedRole.acls || selectedRole.acls.length === 0 ? (
                    <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                      Nenhuma regra de ACL configurada nesta role.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedRole.acls.map((acl, idx) => (
                        <div
                          key={idx}
                          className="rounded-md border p-3 space-y-1 bg-background text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">
                              {acl.acltype}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                acl.allow
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-destructive/10 text-destructive"
                              }`}
                            >
                              {acl.allow ? "Permitir" : "Negar"}
                            </span>
                          </div>
                          <div className="text-muted-foreground font-mono">
                            Tópico: <span className="text-foreground">{acl.topic}</span>
                          </div>
                          <div className="text-muted-foreground">
                            Prioridade: <span className="text-foreground">{acl.priority}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}