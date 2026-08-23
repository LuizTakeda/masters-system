import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  totalPages: number;
  totalCount: number;
  isLoading: boolean;
  onPageChange: (newPage: number) => void;
};

export function RolesPagination({
  page,
  totalPages,
  totalCount,
  isLoading,
  onPageChange,
}: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground bg-muted/20">
      <div>
        Total: <span className="font-medium text-foreground">{totalCount}</span> {totalCount === 1 ? "role" : "roles"}
      </div>

      <div className="flex items-center gap-2">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isLoading}
          >
            <ChevronLeft className="size-3.5" />
            <span className="sr-only">Previous page</span>
          </Button>
          <Button
            variant="outline"
            size="icon-xs"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
          >
            <ChevronRight className="size-3.5" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
