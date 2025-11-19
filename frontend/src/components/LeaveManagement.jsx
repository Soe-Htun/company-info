import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { toast } from 'react-toastify';

import { request } from '../api/client';
import { formatDateDmy } from '../utils/date';
import { Pagination } from './Pagination';

const ISO_DATE_FORMAT = 'YYYY-MM-DD';
const DISPLAY_DATE_FORMAT = 'DD/MM/YYYY';

export function LeaveManagement({ token, onChanged, onGoToEmployee }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ employeeId: '', leaveDate: dayjs().format(ISO_DATE_FORMAT) });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [leaveInput, setLeaveInput] = useState(dayjs().format(ISO_DATE_FORMAT));

  const employeeLookup = useMemo(() => {
    return employeeOptions.reduce((acc, item) => {
      if (item?.id) acc[item.id] = item;
      return acc;
    }, {});
  }, [employeeOptions]);

  const selectedEmployee = useMemo(() => {
    if (!form.employeeId) return null;
    return employeeOptions.find((emp) => String(emp.id) === String(form.employeeId)) || null;
  }, [employeeOptions, form.employeeId]);

  const resetForm = () => {
    setForm({ employeeId: '', leaveDate: dayjs().format(ISO_DATE_FORMAT) });
    setEditingId(null);
    setFormErrors({});
  };

  const toIsoString = (value) => {
    if (!value) return '';
    return value.isValid() ? value.format(ISO_DATE_FORMAT) : '';
  };

  const leaveWindow = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const start = today.getDate() >= 11 ? new Date(year, month, 11) : new Date(year, month - 1, 11);
    const end = today.getDate() >= 11 ? new Date(year, month + 1, 10) : new Date(year, month, 10);
    return { start: dayjs(start), end: dayjs(end) };
  }, []);

  const leaveDateOptions = useMemo(() => {
    const opts = [];
    let cursor = leaveWindow.start;
    while (cursor.isBefore(leaveWindow.end) || cursor.isSame(leaveWindow.end, 'day')) {
      const iso = cursor.format(ISO_DATE_FORMAT);
      opts.push({ value: iso, label: cursor.format(DISPLAY_DATE_FORMAT) });
      cursor = cursor.add(1, 'day');
    }
    return opts;
  }, [leaveWindow.end, leaveWindow.start]);

  const loadEntries = () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    request({ path: '/api/employees/leave', token })
      .then((data) => setEntries(data || []))
      .catch((err) => setError(err.message || 'Unable to load leave entries'))
      .finally(() => setLoading(false));
  };

  const loadEmployees = () => {
    if (!token) return;
    setOptionsLoading(true);
    request({ path: '/api/employees/options', token })
      .then((data) => setEmployeeOptions(data || []))
      .finally(() => setOptionsLoading(false));
  };

  useEffect(() => {
    if (!token) return;
    loadEntries();
    loadEmployees();
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.employeeId) nextErrors.employeeId = 'Employee is required';
    if (!form.leaveDate) nextErrors.leaveDate = 'Leave date is required';
    if (Object.keys(nextErrors).length) {
      setFormErrors(nextErrors);
      return;
    }
    setFormErrors({});
    setSaving(true);
    try {
      const payload = { employeeId: Number(form.employeeId), leaveDate: form.leaveDate };
      const result = editingId
        ? await request({ path: `/api/employees/leave/${editingId}`, method: 'PUT', body: payload, token })
        : await request({ path: '/api/employees/leave', method: 'POST', body: payload, token });
      if (editingId) {
        setEntries((prev) => prev.map((entry) => (entry.id === editingId ? result : entry)));
      } else {
        setEntries((prev) => [result, ...prev]);
      }
      setPage(1);
      toast.success(editingId ? 'Leave updated' : 'Leave added');
      resetForm();
      onChanged?.();
    } catch (err) {
      setError(err.message || 'Unable to save leave');
      setFormErrors(err.payload?.fieldErrors || {});
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setForm({ employeeId: entry.employeeId, leaveDate: entry.leaveDate });
    setLeaveInput(entry.leaveDate);
    setFormErrors({});
  };

  const handleDelete = async (entry) => {
    const confirmed = window.confirm(`Delete leave for ${entry.employeeName} on ${formatDateDmy(entry.leaveDate)}?`);
    if (!confirmed) return;
    try {
      await request({ path: `/api/employees/leave/${entry.id}`, method: 'DELETE', token });
      setEntries((prev) => prev.filter((item) => item.id !== entry.id));
      setPage(1);
      toast.success('Leave deleted');
      onChanged?.();
    } catch (err) {
      setError(err.message || 'Unable to delete leave');
    }
  };

  useEffect(() => {
    setPage(1);
  }, [pageSize, entries.length]);

  const pagedEntries = useMemo(() => {
    const start = (page - 1) * pageSize;
    return entries.slice(start, start + pageSize);
  }, [entries, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil((entries.length || 0) / pageSize));
  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setPage(1);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="glass-panel space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Leave Management</p>
        </div>
        {editingId ? (
          <button
            type="button"
            className="text-sm font-semibold text-brand-accent hover:underline"
            onClick={resetForm}
          >
            Cancel edit
          </button>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="leave-employee">
              Employee <span className="font-semibold text-rose-500">*</span>
            </label>
            <Autocomplete
              id="leave-employee"
              options={employeeOptions}
              loading={optionsLoading}
              getOptionLabel={(option) =>
                option?.name ? `${option.name}${option.department ? ` (${option.department})` : ''}` : ''
              }
              isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
              value={selectedEmployee}
              onChange={(_event, value) => setForm((prev) => ({ ...prev, employeeId: value?.id || '' }))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Type to search and select"
                  size="small"
                  margin="dense"
                  error={Boolean(formErrors.employeeId)}
                  helperText={formErrors.employeeId || ' '}
                />
              )}
              disabled={optionsLoading || saving}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="leave-date">
              Leave Date <span className="font-semibold text-rose-500">*</span>
            </label>
            <Autocomplete
              id="leave-date"
              options={leaveDateOptions}
              getOptionLabel={(option) => option.label || ''}
              isOptionEqualToValue={(option, value) => option.value === value.value}
              value={leaveDateOptions.find((opt) => opt.value === form.leaveDate) || null}
              inputValue={leaveInput}
              onInputChange={(_event, value) => {
                setLeaveInput(value || '');
                setForm((prev) => ({ ...prev, leaveDate: value || '' }));
              }}
              onChange={(_event, value) => {
                setLeaveInput(value?.value || '');
                setForm((prev) => ({ ...prev, leaveDate: value?.value || '' }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="YYYY-MM-DD or pick"
                  size="small"
                  margin="dense"
                  error={Boolean(formErrors.leaveDate)}
                  helperText={formErrors.leaveDate || ' '}
                />
              )}
              disabled={saving}
              freeSolo
            />
            {formErrors.leaveDate ? <p className="mt-1 text-xs text-rose-600">{formErrors.leaveDate}</p> : null}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
          >
            {saving ? 'Saving…' : editingId ? 'Update Leave' : 'Add Leave'}
          </button>
          {!editingId ? null : (
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel
            </button>
          )}
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Employee</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Department
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Leave Date</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <tr key={`leave-loading-${idx}`}>
                    <td className="px-3 py-3" colSpan={4}>
                      <div className="h-4 animate-pulse rounded-full bg-slate-200" />
                    </td>
                  </tr>
                ))
              ) : !entries.length ? (
                <tr>
                  <td className="px-3 py-4 text-center text-sm text-slate-500" colSpan={4}>
                    No leave entries yet.
                  </td>
                </tr>
              ) : (
                pagedEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        className="font-semibold text-slate-800 hover:text-brand-accent"
                        onClick={() => onGoToEmployee?.(entry.employeeId)}
                      >
                        {entry.employeeName}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {entry.department ||
                        employeeLookup[entry.employeeId]?.department ||
                        '—'}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-slate-700">{formatDateDmy(entry.leaveDate)}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:text-brand-accent"
                          onClick={() => handleEdit(entry)}
                          disabled={saving}
                          aria-label="Edit leave"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 0 1 2.828 2.828l-.707.707-2.828-2.828.707-.707Z" />
                            <path d="M14 8.414 11.586 6 4 13.586V16h2.414L14 8.414Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-rose-200 p-1 text-rose-500 transition hover:text-rose-600"
                          onClick={() => handleDelete(entry)}
                          disabled={saving}
                          aria-label="Delete leave"
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
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={entries.length}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
      />
      </div>
    </LocalizationProvider>
  );
}
