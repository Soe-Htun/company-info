import { useEffect } from 'react';

export function ToastContainer({ toasts = [], onDismiss }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-3 sm:right-6 sm:top-6">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={() => onDismiss?.(toast.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss?.(), toast.duration || 3000);
    return () => clearTimeout(timer);
  }, [toast.duration, onDismiss]);

  const schemes = {
    success: {
      icon: '✅',
      ring: 'bg-emerald-100 text-emerald-700',
      card: 'border-emerald-100 bg-white/90',
    },
    warning: {
      icon: '⚡️',
      ring: 'bg-amber-100 text-amber-700',
      card: 'border-amber-100 bg-white/90',
    },
    error: {
      icon: '⚠️',
      ring: 'bg-rose-100 text-rose-700',
      card: 'border-rose-100 bg-white/90',
    },
  };

  const scheme = schemes[toast.type] || schemes.success;

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg backdrop-blur-sm transition ${scheme.card}`}
      style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.12)' }}
      role="status"
    >
      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-base ${scheme.ring}`} aria-hidden="true">
        {scheme.icon}
      </div>
      <div className="flex-1 text-sm font-semibold text-slate-800">{toast.message}</div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-xs font-semibold text-slate-400 transition hover:text-slate-700"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
}
