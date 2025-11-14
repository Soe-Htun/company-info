export function Pagination({ page, totalPages, onPageChange, totalItems, pageSize, onPageSizeChange }) {
  const canGoBack = page > 1;
  const canGoForward = page < totalPages;
  const start = totalItems ? (page - 1) * pageSize + 1 : 0;
  const end = totalItems ? Math.min(page * pageSize, totalItems) : 0;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        Showing <span className="font-semibold text-slate-700">{start === end ? end : `${start}-${end}`}</span> of{' '}
        <span className="font-semibold text-slate-700">{totalItems}</span> employees
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Rows / page
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange?.(Number(event.target.value))}
            className="ml-2 rounded-lg border border-slate-200 px-2 py-1 text-sm focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-soft"
          >
            {[5, 10, 15, 20].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => canGoBack && onPageChange(page - 1)}
          disabled={!canGoBack}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-sm font-semibold text-slate-700">
          {page} / {totalPages || 1}
        </span>
        <button
          type="button"
          onClick={() => canGoForward && onPageChange(page + 1)}
          disabled={!canGoForward}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
