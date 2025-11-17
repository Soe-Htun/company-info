import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { buildQuery, request } from '../api/client';
import { EmployeeEditor } from '../components/EmployeeEditor';
import { EmployeeTable } from '../components/EmployeeTable';
import { Pagination } from '../components/Pagination';
import { StatCard } from '../components/StatCard';
import { UpcomingBirthdays } from '../components/UpcomingBirthdays';
import { UserManagement } from '../components/UserManagement';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { UserMenu } from '../components/UserMenu';
import { toast } from 'react-toastify';

const SORT_COLUMN_MAP = {
  name: 'name',
  department: 'department',
  birthday: 'birthday',
  age: 'age',
  hireDate: 'hire_date',
};

const STATUS_OPTIONS = ['Active', 'On Leave'];
const EXCLUDED_DEPARTMENTS = new Set(['ဆရာ']);

const formatDateDmy = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, totalItems: 0, pageSize: 10 });
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', department: '', status: 'all', pageSize: 10 });
  const [sort, setSort] = useState({ sortBy: 'name', sortDir: 'asc' });
  const debouncedSearch = useDebounce(filters.search);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [activePanel, setActivePanel] = useState('employees');
  const [editorMode, setEditorMode] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editorError, setEditorError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [editorBusy, setEditorBusy] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();
  const toastOptions = {};

  const statusParam = filters.status === 'all' ? undefined : filters.status;

  const exportCsv = () => {
    if (!employees.length) return;
    const headers = ['Name', 'Birthday', 'Start Date', 'Address', 'Age', 'Department', 'Status'];
    const rows = employees.map((employee) => [
      employee.name,
      formatDateDmy(employee.birthday),
      formatDateDmy(employee.hireDate),
      employee.address,
      employee.age,
      employee.department,
      employee.status || '',
    ]);
    const csv = [headers, ...rows].map((cells) => cells.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `employees-page-${page}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const query = buildQuery({
      page,
      pageSize: filters.pageSize,
      search: debouncedSearch,
      department: filters.department,
      status: statusParam,
      sortBy: SORT_COLUMN_MAP[sort.sortBy],
      sortDir: sort.sortDir,
    });

    request({ path: `/api/employees${query}`, token, signal: controller.signal })
      .then((payload) => {
        setEmployees(payload.data);
        setMeta(payload.meta);
        if (payload.meta?.page) {
          setPage((current) => (payload.meta.page !== current ? payload.meta.page : current));
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        if (err.status === 401) return;
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [
    token,
    page,
    filters.pageSize,
    filters.department,
    statusParam,
    debouncedSearch,
    sort.sortBy,
    sort.sortDir,
    refreshIndex,
  ]);

  useEffect(() => {
    if (!token) return;
    request({ path: '/api/employees/departments', token })
      .then((list) => setDepartments(list.filter((dept) => !EXCLUDED_DEPARTMENTS.has(dept))))
      .catch((err) => {
        if (err.status === 401) return;
      });
  }, [token, refreshIndex]);

  useEffect(() => {
    if (!token) return;
    setStatsLoading(true);
    request({ path: '/api/employees/stats', token })
      .then((payload) => setStats(payload))
      .catch((err) => {
        if (err.status === 401) return;
      })
      .finally(() => setStatsLoading(false));
  }, [token, refreshIndex]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.department, statusParam, filters.pageSize]);

  useEffect(() => {
    setPage(1);
  }, [sort.sortBy, sort.sortDir]);

  const openCreate = () => {
    setEditorMode('create');
    setEditingEmployee(null);
    setEditorError(null);
    setFieldErrors({});
    setIsEditorOpen(true);
  };

  const openEdit = (employee) => {
    setEditorMode('edit');
    setEditingEmployee(employee);
    setEditorError(null);
    setFieldErrors({});
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorMode(null);
    setEditingEmployee(null);
    setEditorError(null);
    setIsEditorOpen(false);
  };

  const submitEditor = async (payload) => {
    if (!editorMode) return;
    setEditorBusy(true);
    setEditorError(null);
    try {
      const path =
        editorMode === 'edit' && editingEmployee ? `/api/employees/${editingEmployee.id}` : '/api/employees';
      const method = editorMode === 'edit' ? 'PUT' : 'POST';
      await request({ path, method, token, body: payload });
      setRefreshIndex((value) => value + 1);
      toast.success(
        editorMode === 'edit' ? 'Employee updated successfully' : 'Employee created successfully',
        toastOptions,
      );
      setIsEditorOpen(false);
      closeEditor();
    } catch (err) {
      const message = err.message || '';
      const nextErrors = {};
      if (/employee name/i.test(message)) {
        nextErrors.name = message;
      }
      setFieldErrors(nextErrors);
      if (!Object.keys(nextErrors).length) {
        setEditorError(message);
      } else {
        setEditorError(null);
      }
    } finally {
      setEditorBusy(false);
    }
  };

  const requestDelete = (employee) => {
    setDeleteTarget(employee);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await request({ path: `/api/employees/${deleteTarget.id}`, method: 'DELETE', token });
      setRefreshIndex((value) => value + 1);
      toast.success('Employee deleted successfully', toastOptions);
    } catch (err) {
      if (err.status === 401) return;
      setError(err.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  const cancelDelete = () => setDeleteTarget(null);

  const handlePageSizeChange = (size) => {
    setFilters((prev) => ({ ...prev, pageSize: size }));
  };

  const departmentMaxCount = useMemo(() => {
    if (!stats?.departmentDistribution?.length) return 1;
    return Math.max(...stats.departmentDistribution.map((item) => item.count));
  }, [stats]);

  return (
    <>
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-accent">employee info</p>
            <h1 className="text-xl font-semibold text-slate-900">99 Company</h1>
          </div>
          <UserMenu user={user} onLogout={logout} />
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setActivePanel('employees')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activePanel === 'employees' ? 'bg-brand-accent text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Employee Directory
            </button>
            <button
              type="button"
              onClick={() => setActivePanel('users')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activePanel === 'users' ? 'bg-brand-accent text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              User Accounts
            </button>
          </div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            {activePanel === 'employees' ? 'directory view' : 'access control'}
          </p>
        </div>

        {activePanel === 'employees' ? (
          <>
            <section className="grid gap-4 md:grid-cols-2">
              <StatCard
                label="Total Employees"
                value={statsLoading ? '…' : stats?.totalEmployees ?? '0'}
                helper={stats ? `Across ${stats.departmentDistribution?.length || 0} departments` : ' '}
                accent="100%"
              />
              <StatCard
                label="Total Leave"
                value={statsLoading ? '…' : stats?.totalOnLeave ?? '0'}
                helper="Currently marked On Leave"
                accent="45%"
              />
            </section>

            <section className="glass-panel space-y-4 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-1 flex-wrap gap-4">
                  <div className="flex-1 min-w-[220px]">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="search">
                      Search
                    </label>
                    <div className="mt-1 relative">
                      <input
                        id="search"
                        type="text"
                        value={filters.search}
                        onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                        placeholder="Search Name"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 pr-10 text-sm focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-soft"
                      />
                      {filters.search ? (
                        <button
                          type="button"
                          onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-slate-100 p-1 text-slate-500 transition hover:text-slate-700"
                          aria-label="Clear search"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M6 6l12 12M6 18 18 6"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="min-w-[160px]">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="department">
                      Department
                    </label>
                    <select
                      id="department"
                      value={filters.department}
                      onChange={(event) => setFilters((prev) => ({ ...prev, department: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-soft"
                    >
                      <option value="">All</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="min-w-[140px]">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="status">
                      Status
                    </label>
                    <select
                      id="status"
                      value={filters.status}
                      onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-soft"
                    >
                      <option value="all">All</option>
                      {STATUS_OPTIONS.map((statusOption) => (
                        <option key={statusOption} value={statusOption}>
                          {statusOption}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={exportCsv}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFilters({ search: '', department: '', status: 'all', pageSize: filters.pageSize });
                      setSort({ sortBy: 'name', sortDir: 'asc' });
                    }}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={openCreate}
                    className="rounded-xl bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
                  >
                    + Add Employee
                  </button>
                </div>
              </div>
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              <EmployeeTable
                data={employees}
                sortBy={sort.sortBy}
                sortDir={sort.sortDir}
                onSortChange={(nextSort) => setSort(nextSort)}
                loading={loading}
                onEdit={openEdit}
                onDelete={requestDelete}
                onDetail={(employee) => navigate(`/details/${employee.id}`)}
                rowOffset={Math.max(0, ((meta.page || 1) - 1) * filters.pageSize)}
              />
              <Pagination
                page={page}
                totalPages={meta.totalPages || 1}
                onPageChange={(nextPage) => setPage(nextPage)}
                totalItems={meta.totalItems || 0}
                pageSize={meta.pageSize || filters.pageSize}
                onPageSizeChange={handlePageSizeChange}
              />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="glass-panel p-4">
                <p className="text-sm font-semibold text-slate-600">Department Distribution</p>
                {!stats?.departmentDistribution?.length ? (
                  <p className="mt-3 text-sm text-slate-500">{statsLoading ? 'Loading...' : 'No data yet.'}</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {stats.departmentDistribution.map((dept) => (
                      <li key={dept.department}>
                        <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                          <span>{dept.department}</span>
                          <span>{dept.count}</span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-brand-accent/70"
                            style={{ width: `${Math.round((dept.count / departmentMaxCount) * 100)}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <UpcomingBirthdays items={stats?.upcomingBirthdays} />
            </section>
          </>
        ) : (
          <UserManagement />
        )}
      </main>
      {isEditorOpen ? (
        <Modal
          title={editorMode === 'edit' ? `Edit ${editingEmployee?.name || 'Employee'}` : 'Add Employee'}
          onClose={closeEditor}
        >
        <EmployeeEditor
          mode={editorMode}
          employee={editingEmployee}
          onSubmit={submitEditor}
          onCancel={closeEditor}
          busy={editorBusy}
          error={editorError}
          fieldErrors={fieldErrors}
          onClearFieldError={(field) =>
            setFieldErrors((prev) => {
              if (!prev[field]) return prev;
              const next = { ...prev };
              delete next[field];
              return next;
            })
          }
          departments={departments}
            helper={
              <span className="text-sm text-slate-500">
                <span className="font-semibold text-rose-500">*</span> ပြထားသည့်အရာများကို အကုန်ဖြည့်ပါ
              </span>
            }
          />
        </Modal>
      ) : null}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Employee"
        message={
          <span className="text-sm text-slate-600">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-slate-900">{deleteTarget?.name || 'this employee'}</span>?
          </span>
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
    </>
  );
}
