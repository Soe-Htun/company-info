export function OnLeaveToday({ items = [], total = 0, loading }) {
  if (!loading && (!items || items.length === 0) && !total) {
    return null;
  }

  return (
    <div className="glass-panel h-full p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">On Leave Today</p>
          <p className="text-sm text-slate-500">Auto-resets daily</p>
        </div>
        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">{total || 0}</span>
      </div>
      {loading ? (
        <ul className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <li key={`leave-skel-${idx}`} className="h-10 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </ul>
      ) : !items.length ? (
        <p className="mt-4 text-sm text-slate-500">No one is on leave today.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-amber-100 bg-white px-3 py-2 shadow-sm"
            >
              <div>
                <p className="font-semibold text-slate-800">{item.name}</p>
                <p className="text-xs text-slate-500">{item.department || '—'}</p>
              </div>
              <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">On Leave</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
