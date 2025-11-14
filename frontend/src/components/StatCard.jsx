export function StatCard({ label, value, helper, accent }) {
  return (
    <div className="glass-panel flex flex-col gap-1 p-4">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
      {accent ? <div className="mt-3 h-1 rounded-full bg-brand-soft">
        <div className="h-full rounded-full bg-brand-accent transition-all" style={{ width: accent }} />
      </div> : null}
    </div>
  );
}
