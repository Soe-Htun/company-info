import { formatMonthDay } from '../utils/date';

export function UpcomingBirthdays({ items, onSelect }) {
  const today = new Date();
  const isToday = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    return date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
  };

  const todays = (items || []).filter((item) => isToday(item.birthday));
  const upcoming = (items || []).filter((item) => !isToday(item.birthday) && item.daysUntil > 0);

  return (
    <div className="glass-panel p-4">
      <p className="text-sm font-semibold text-slate-600">Upcoming Birthdays</p>
      {todays.length ? (
        <div className="mt-3 space-y-2">
          {todays.map((item) => (
            <div
              key={`today-${item.id}`}
              className="flex items-center justify-between rounded-xl border border-brand-soft bg-brand-soft px-3 py-2"
              role={onSelect ? 'button' : undefined}
              tabIndex={onSelect ? 0 : undefined}
              onClick={() => onSelect?.(item.id)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && onSelect) {
                  e.preventDefault();
                  onSelect(item.id);
                }
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg" aria-hidden="true">
                  🎂
                </span>
                <p className="text-sm font-semibold text-brand-accent">Today is {item.name}&apos;s Birthday</p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-accent">Celebrate</span>
            </div>
          ))}
        </div>
      ) : null}

      {upcoming.length ? (
        <ul className={`mt-4 space-y-3 ${todays.length ? 'pt-2 border-t border-slate-100' : ''}`}>
          {upcoming.map((item) => (
            <li
              key={item.id}
              className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-100 px-3 py-2 hover:bg-brand-soft/40"
              onClick={() => onSelect?.(item.id)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && onSelect) {
                  e.preventDefault();
                  onSelect(item.id);
                }
              }}
              role={onSelect ? 'button' : undefined}
              tabIndex={onSelect ? 0 : undefined}
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                <p className="text-xs text-slate-500">
                  {item.department} • {formatMonthDay(item.birthday)}
                </p>
              </div>
              <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-accent">
                {item.daysUntil}d
              </span>
            </li>
          ))}
        </ul>
      ) : !todays.length ? (
        <p className="mt-2 text-sm text-slate-500">No birthdays within the next 20 days.</p>
      ) : null}
    </div>
  );
}
