import { useEffect, useRef, useState } from 'react';

export function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        <span className="text-sm font-semibold text-slate-900 truncate max-w-[140px]">{user?.username || '—'}</span>
        <span className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true">
          ▼
        </span>
      </button>
      {open ? (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-100 bg-white py-2 text-sm shadow-lg">
          <button
            type="button"
            onClick={() => {
              onLogout();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-slate-600 transition hover:bg-slate-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 3h-6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M10 12h11m0 0-3-3m3 3-3 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}
