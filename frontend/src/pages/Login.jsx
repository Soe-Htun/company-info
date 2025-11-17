import { useState } from 'react';

import { request } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '99admin', password: 'StrongPassword' });
  const [status, setStatus] = useState({ loading: false, error: null });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: null });
    try {
      const data = await request({
        path: '/api/auth/login',
        method: 'POST',
        body: form,
      });
      login(data);
    } catch (err) {
      setStatus({ loading: false, error: err.message });
      return;
    }
    setStatus({ loading: false, error: null });
  };

  const fillDemo = () => {
    setForm({ username: '99admin', password: 'StrongPassword' });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-soft via-white to-white px-4">
      <div className="glass-panel w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-accent">employee info</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Secure Admin Login</h1>
          <p className="mt-1 text-sm text-slate-500">Use the provided demo credentials to explore the dashboard.</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="text-sm font-medium text-slate-700">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              placeholder="99admin"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-soft"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="mt-1 flex items-center rounded-xl border border-slate-200 px-3 text-sm focus-within:border-brand-accent focus-within:ring-2 focus-within:ring-brand-soft">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="StrongPassword"
                className="w-full border-none py-2 text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="ml-2 text-slate-500 transition hover:text-slate-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 3l18 18M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88M9.88 9.88l4.24 4.24"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10.73 6.29C11.12 6.2 11.55 6.15 12 6.15c5.25 0 9.74 4.2 10.5 6.06-.32.78-1.1 1.97-2.32 3.1M6.82 6.82C3.7 8.59 2 12.21 2 12.21c.56 1.35 1.64 2.76 3.04 3.91"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M2 12s4.5-6 10-6 10 6 10 6-4.5 6-10 6S2 12 2 12Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {status.error ? <p className="text-sm text-rose-600">{status.error}</p> : null}
          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={status.loading}
              className="w-full rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600 disabled:opacity-50"
            >
              {status.loading ? 'Authenticating...' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={fillDemo}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Fill Demo Credentials
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
