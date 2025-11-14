import { useEffect, useState } from 'react';

import { request } from '../api/client';
import { useAuth } from '../context/AuthContext';

export function UserManagement() {
  const { token, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', role: 'admin' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadUsers = () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    request({ path: '/api/users', token })
      .then((data) => setUsers(data))
      .catch((err) => {
        if (err.status === 401) {
          logout();
          return;
        }
        setError(err.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.username || !form.password) {
      setError('Username and password are required');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    request({
      path: '/api/users',
      method: 'POST',
      token,
      body: form,
    })
      .then(() => {
        setSuccess(`Created user ${form.username}`);
        setForm({ username: '', password: '', role: 'admin' });
        loadUsers();
      })
      .catch((err) => {
        if (err.status === 401) {
          logout();
          return;
        }
        setError(err.message);
      })
      .finally(() => setSaving(false));
  };

  return (
    <div className="glass-panel space-y-6 p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-accent">access control</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">Manage Admin Accounts</h2>
        <p className="text-sm text-slate-500">
          Create additional dashboard logins. Passwords are hashed server-side before storage.
        </p>
      </div>

      <form className="grid gap-4 md:grid-cols-3" onSubmit={handleSubmit}>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="user-username">
            Username
          </label>
          <input
            id="user-username"
            type="text"
            value={form.username}
            onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-soft"
            placeholder="admin@example"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="user-password">
            Password
          </label>
          <input
            id="user-password"
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-soft"
            placeholder="StrongPassword"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="user-role">
            Role
          </label>
          <select
            id="user-role"
            value={form.role}
            onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-soft"
          >
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="md:col-span-3">
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-brand-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
          >
            {saving ? 'Creating…' : 'Create Login'}
          </button>
        </div>
      </form>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

      <div>
        <p className="text-sm font-semibold text-slate-600">Existing Accounts</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">Username</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-3 text-slate-500" colSpan={3}>
                    Loading users…
                  </td>
                </tr>
              ) : !users.length ? (
                <tr>
                  <td className="px-3 py-3 text-slate-500" colSpan={3}>
                    No users yet.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-900">{user.username}</td>
                    <td className="px-3 py-2 text-slate-600">{user.role}</td>
                    <td className="px-3 py-2 text-slate-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
