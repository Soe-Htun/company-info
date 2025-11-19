import { useEffect, useState } from 'react';

import { request } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Pagination } from './Pagination';

export function UserManagement() {
  const { token, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', role: 'admin' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadUsers = () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    request({ path: '/api/users', token })
      .then((data) => {
        setUsers(data);
        setPage(1);
      })
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

  const startEdit = (user) => {
    setEditingId(user.id);
    setForm({ username: user.username, password: '', role: user.role || 'admin' });
    setError(null);
    setSuccess(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ username: '', password: '', role: 'admin' });
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    const isCreate = !editingId;
    if (isCreate && (!form.username || !form.password)) {
      setError('Username and password are required');
      setSaving(false);
      return;
    }
    const payload = {
      username: form.username,
      role: form.role,
      ...(form.password ? { password: form.password } : {}),
    };
    request({
      path: isCreate ? '/api/users' : `/api/users/${editingId}`,
      method: isCreate ? 'POST' : 'PUT',
      token,
      body: payload,
    })
      .then(() => {
        setSuccess(isCreate ? `Created user ${form.username}` : `Updated user ${form.username}`);
        resetForm();
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

  const handleDelete = (user) => {
    if (!window.confirm(`Delete user ${user.username}?`)) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    request({ path: `/api/users/${user.id}`, method: 'DELETE', token })
      .then(() => {
        setSuccess(`Deleted user ${user.username}`);
        if (editingId === user.id) {
          resetForm();
        }
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

  const pagedUsers = users.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
  const totalPages = Math.max(1, Math.ceil((users.length || 0) / pageSize));
  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setPage(1);
  };

  return (
    <div className="glass-panel space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-accent">access control</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">Manage Admin Accounts</h2>
        </div>
        {editingId ? (
          <button
            type="button"
            className="text-sm font-semibold text-brand-accent hover:underline"
            onClick={resetForm}
            disabled={saving}
          >
            Cancel edit
          </button>
        ) : null}
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
            Password {editingId ? <span className="text-xs text-slate-400">(leave blank to keep)</span> : null}
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
            {saving ? 'Saving…' : editingId ? 'Update Login' : 'Create Login'}
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
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-3 text-slate-500" colSpan={4}>
                    Loading users…
                  </td>
                </tr>
              ) : !users.length ? (
                <tr>
                  <td className="px-3 py-3 text-slate-500" colSpan={4}>
                    No users yet.
                  </td>
                </tr>
              ) : (
                pagedUsers.map((user) => (
                  <tr key={user.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-900">{user.username}</td>
                    <td className="px-3 py-2 text-slate-600">{user.role}</td>
                    <td className="px-3 py-2 text-slate-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:text-brand-accent"
                          onClick={() => startEdit(user)}
                          disabled={saving}
                          aria-label="Edit user"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 0 1 2.828 2.828l-.707.707-2.828-2.828.707-.707Z" />
                            <path d="M14 8.414 11.586 6 4 13.586V16h2.414L14 8.414Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-rose-200 p-1 text-rose-500 transition hover:text-rose-600"
                          onClick={() => handleDelete(user)}
                          disabled={saving}
                          aria-label="Delete user"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M7 2a1 1 0 0 0-1 1v1H3.5a.5.5 0 0 0 0 1h13a.5.5 0 0 0 0-1H14V3a1 1 0 0 0-1-1H7Zm-1 5v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7H6Z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={users.length}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  );
}
