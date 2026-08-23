import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Info, Shield } from "lucide-react";
import type { GetRolesResponseType } from "@repo/types/endpoints/mqtt/role";

type RoleItem = GetRolesResponseType["roles"][number];

type Props = {
  roles?: RoleItem[];
  isLoading: boolean;
  isError: unknown;
  onSelectRole: (role: RoleItem) => void;
};

export function RolesTable({ roles, isLoading, isError, onSelectRole }: Props) {
  return (
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
                  onClick={() => onSelectRole(role)}
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
  );
}

