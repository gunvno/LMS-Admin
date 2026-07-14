"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./Pagination.module.css";

type PaginationProps = {
  summary: ReactNode;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
};

function visiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index);
  return [...new Set([0, currentPage - 1, currentPage, currentPage + 1, totalPages - 1])]
    .filter((page) => page >= 0 && page < totalPages)
    .sort((left, right) => left - right);
}

export default function Pagination({
  summary,
  currentPage = 0,
  totalPages = 1,
  onPageChange,
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(0, currentPage), safeTotalPages - 1);
  const pages = visiblePages(safeCurrentPage, safeTotalPages);

  return (
    <div className={styles.footer}>
      <span className={styles.summary}>{summary}</span>
      <nav className={styles.pagination} aria-label="Phân trang">
        <button
          type="button"
          className={styles.button}
          aria-label="Trang trước"
          disabled={!onPageChange || safeCurrentPage === 0}
          onClick={() => onPageChange?.(safeCurrentPage - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((page, index) => (
          <span key={page} style={{ display: "contents" }}>
            {index > 0 && page - pages[index - 1] > 1 && <span className={styles.dots}>…</span>}
            <button
              type="button"
              className={`${styles.button} ${page === safeCurrentPage ? styles.active : ""}`}
              aria-label={`Trang ${page + 1}`}
              aria-current={page === safeCurrentPage ? "page" : undefined}
              disabled={!onPageChange && page !== safeCurrentPage}
              onClick={() => onPageChange?.(page)}
            >
              {page + 1}
            </button>
          </span>
        ))}
        <button
          type="button"
          className={styles.button}
          aria-label="Trang sau"
          disabled={!onPageChange || safeCurrentPage >= safeTotalPages - 1}
          onClick={() => onPageChange?.(safeCurrentPage + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </nav>
    </div>
  );
}
