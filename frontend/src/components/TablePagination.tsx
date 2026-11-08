import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";

interface Props {
  page: number;
  totalPages: number;
  from: number;
  to: number;
  total: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

function pageNumbers(page: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const nums = new Set([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...nums].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - (sorted[i - 1] as number) > 1) result.push("ellipsis");
    result.push(n);
  });
  return result;
}

export function TablePagination({ page, totalPages, from, to, total, onPageChange, itemLabel = "élément(s)" }: Props) {
  if (total === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
      <p className="text-xs text-muted-foreground order-2 sm:order-1">
        {from}–{to} sur {total} {itemLabel}
      </p>
      {totalPages > 1 && (
        <Pagination className="mx-0 w-auto order-1 sm:order-2">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => { e.preventDefault(); if (page > 1) onPageChange(page - 1); }}
                className={page === 1 ? "pointer-events-none opacity-40" : ""}
              />
            </PaginationItem>
            {pageNumbers(page, totalPages).map((n, i) =>
              n === "ellipsis" ? (
                <PaginationItem key={`e${i}`}><PaginationEllipsis /></PaginationItem>
              ) : (
                <PaginationItem key={n}>
                  <PaginationLink href="#" isActive={n === page} onClick={(e) => { e.preventDefault(); onPageChange(n); }}>
                    {n}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => { e.preventDefault(); if (page < totalPages) onPageChange(page + 1); }}
                className={page === totalPages ? "pointer-events-none opacity-40" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
