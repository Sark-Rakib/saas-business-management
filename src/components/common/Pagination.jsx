"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

function getPageNumbers(current, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  if (current <= 3) {
    pages.push(1, 2, 3, 4, "...");
  } else if (current >= total - 2) {
    pages.push("...", total - 3, total - 2, total - 1, total);
  } else {
    pages.push("...", current - 1, current, current + 1, "...");
  }
  return pages;
}

export default function Pagination({ page, pages, total, pageSize, onChange }) {
  if (pages <= 1) return null;

  const pageNumbers = getPageNumbers(page, pages);

  return (
    <div className="flex items-center justify-between text-sm text-ink-muted">
      <span>
        Page {page} of {pages}
        {total != null && ` · ${total} total`}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pageNumbers.map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className="px-1.5 text-ink-muted">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition ${
                p === page
                  ? "bg-primary-600 text-white"
                  : "hover:bg-slate-100 dark:hover:bg-slate-700 text-ink"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
