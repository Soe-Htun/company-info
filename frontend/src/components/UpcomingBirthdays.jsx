export function UpcomingBirthdays({ items }) {
  if (!items?.length) {
    return (
      <div className="glass-panel p-4">
        <p className="text-sm font-semibold text-slate-600">Upcoming Birthdays</p>
        <p className="mt-2 text-sm text-slate-500">No birthdays within the next 30 days.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4">
      <p className="text-sm font-semibold text-slate-600">Upcoming Birthdays</p>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
            <div>
              <p className="text-sm font-semibold text-slate-800">{item.name}</p>
              <p className="text-xs text-slate-500">
                {item.department} • {new Date(item.birthday).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </p>
            </div>
            <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-accent">
              {item.daysUntil}d
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
