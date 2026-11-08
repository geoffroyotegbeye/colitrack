import { useState, useMemo, useEffect } from "react";

export function usePagination<T>(items: T[], pageSize = 8) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const from = items.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, items.length);

  return { page, setPage, totalPages, pageItems, from, to, total: items.length };
}
