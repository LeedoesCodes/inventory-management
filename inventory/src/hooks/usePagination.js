import { useState, useEffect, useMemo, useCallback } from "react";

export const usePagination = (items = [], itemsPerPage = 20) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => {
    const total = Math.ceil(items.length / itemsPerPage);
    return Math.max(1, total);
  }, [items.length, itemsPerPage]);

  // Clamp page if filtering shrinks result set.
  useEffect(() => {
    setCurrentPage((prev) => Math.min(Math.max(prev, 1), totalPages));
  }, [totalPages]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [currentPage, items, itemsPerPage]);

  const goToPage = useCallback(
    (pageNumber) => {
      const pageNum = Math.max(1, Math.min(pageNumber, totalPages));
      setCurrentPage(pageNum);
    },
    [totalPages],
  );

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    paginatedItems,
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    resetPagination,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};
