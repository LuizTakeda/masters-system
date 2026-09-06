import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  page: number;
  totalPages: number;
  totalCount: number;
  isLoading?: boolean;
  onPageChange: (newPage: number) => void;
  resourceName?: {
    singular: string;
    plural: string;
  };
};

export function EntityPagination({
  page,
  totalPages,
  totalCount,
  isLoading = false,
  onPageChange,
  resourceName,
}: Props) {
  if (totalCount <= 0) {
    return null;
  }

  const noun = resourceName
    ? totalCount === 1
      ? resourceName.singular
      : resourceName.plural
    : totalCount === 1
      ? "entity"
      : "entities";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border rounded-xl bg-card text-xs text-muted-foreground shadow-2xs">
      <div>
        <span>
          Showing page{" "}
          <span className="font-semibold text-foreground">{page}</span> of{" "}
          <span className="font-semibold text-foreground">{totalPages}</span> (
          {totalCount} {noun})
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
          className="h-8 gap-1 text-xs"
        >
          <ChevronLeft className="size-3.5" />
          <span>Previous</span>
        </Button>
        <div className="px-2 text-xs font-medium text-foreground">
          {page} / {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isLoading}
          className="h-8 gap-1 text-xs"
        >
          <span>Next</span>
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
