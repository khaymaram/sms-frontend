import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "./Button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";

interface PaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function Pagination({
  page,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const safeTotalPages = Math.max(
    totalPages,
    1
  );

  const start =
    totalCount === 0
      ? 0
      : (page - 1) * pageSize + 1;

  const end = Math.min(
    page * pageSize,
    totalCount
  );

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">

      <div>
        {start}-{end} of {totalCount}
      </div>

      <div className="flex items-center gap-2">

        <div className="flex items-center gap-1.5">
          <span>Rows</span>

          <Select
            value={String(pageSize)}
            onValueChange={(value) =>
              onPageSizeChange(
                Number(value)
              )
            }
          >
            <SelectTrigger selectSize="sm" className="w-[60px]">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="5">
                5
              </SelectItem>

              <SelectItem value="10">
                10
              </SelectItem>

              <SelectItem value="20">
                20
              </SelectItem>

              <SelectItem value="50">
                50
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">

          <Button
            variant="outline"
            size="sm"
            className="w-8 px-0"
            aria-label="Previous page"
            onClick={() =>
              onPageChange(page - 1)
            }
            disabled={page <= 1}
          >
            <ChevronLeft />
          </Button>

          <span className="min-w-12 text-center font-medium text-foreground">
            {page} / {safeTotalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            className="w-8 px-0"
            aria-label="Next page"
            onClick={() =>
              onPageChange(page + 1)
            }
            disabled={
              page >= safeTotalPages
            }
          >
            <ChevronRight />
          </Button>

        </div>
      </div>
    </div>
  );
}
