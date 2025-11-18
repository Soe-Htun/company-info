export function ActiveFilters({ search, department, status, onClear, onClearAll }) {
  const active = [
    search ? { key: 'search', label: `Search: ${search}` } : null,
    department ? { key: 'department', label: `Department: ${department}` } : null,
    status && status !== 'all' ? { key: 'status', label: `Status: ${status}` } : null,
  ].filter(Boolean);

  if (!active.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
      <span className="font-semibold uppercase tracking-wide text-slate-500">Active filters</span>
      {active.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onClear?.(item.key)}
          className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-medium transition hover:bg-slate-200"
        >
          <span>{item.label}</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-slate-500" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M6 18 18 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      ))}
      {active.length > 1 ? (
        <button
          type="button"
          onClick={() => onClearAll?.()}
          className="ml-auto text-xs font-semibold text-brand-accent underline decoration-2 underline-offset-2 transition hover:text-blue-700"
        >
          Clear all
        </button>
      ) : null}
    </div>
  );
}
