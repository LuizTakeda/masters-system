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

export function TablePagination({
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
      ? "item"
      : "items";

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground bg-muted/20">
      <div>
        <span>
          Showing page <span className="font-semibold text-foreground">{page}</span> of{" "}
          <span className="font-semibold text-foreground">{totalPages}</span> ({totalCount}{" "}
          {noun})
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon-xs"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
          title="Previous page"
        >
          <ChevronLeft className="size-3.5" />
          <span className="sr-only">Previous page</span>
        </Button>
        <Button
          variant="outline"
          size="icon-xs"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isLoading}
          title="Next page"
        >
          <ChevronRight className="size-3.5" />
          <span className="sr-only">Next page</span>
        </Button>
      </div>
    </div>
  );
}

