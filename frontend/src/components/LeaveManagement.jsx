import { useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { toast } from 'react-toastify';

import { request } from '../api/client';
import { formatDateNamedMonth } from '../utils/date';
import { Pagination } from './Pagination';

const ISO_DATE_FORMAT = 'YYYY-MM-DD';
const DISPLAY_DATE_FORMAT = 'DD/MM/YYYY';
const EMPTY_FORM = {
  employeeIds: [],
  leaveDate: dayjs().format(ISO_DATE_FORMAT),
};

export function LeaveManagement({ token, onChanged, onGoToEmployee }) {
  const [entries, setEntries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({ employeeId: '', leaveDate: '' });
  const formRef = useRef(null);

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setFormErrors({});
  };

  const filteredEntries = useMemo(() => {
    const filterDate = filters.leaveDate ? dayjs(filters.leaveDate).format(ISO_DATE_FORMAT) : null;
    return entries.filter((entry) => {
      if (filters.employeeId && String(entry.employeeId) !== String(filters.employeeId)) {
        return false;
      }
      if (filterDate) {
        const entryDate = dayjs(entry.leaveDate).format(ISO_DATE_FORMAT);
        if (entryDate !== filterDate) {
          return false;
        }
      }
      return true;
    });
  }, [entries, filters.employeeId, filters.leaveDate]);

  const employeeLookup = useMemo(() => {
    return employees.reduce((map, item) => {
      if (item?.id) map[item.id] = item;
      return map;
    }, {});
  }, [employees]);

  const selectedEmployees = useMemo(() => {
    return form.employeeIds.map((id) => employees.find((emp) => String(emp.id) === String(id))).filter(Boolean);
  }, [employees, form.employeeIds]);

  const filterEmployeeValue = useMemo(() => {
    if (!filters.employeeId) return null;
    return employees.find((emp) => String(emp.id) === String(filters.employeeId)) || null;
  }, [employees, filters.employeeId]);

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
    request({ path: '/api/employees/options', token })
      .then((list) => setEmployees(list || []))
      .catch(() => {});
  };

  useEffect(() => {
    if (!token) return;
    loadEntries();
    loadEmployees();
  }, [token]);

  useEffect(() => {
    setPage(1);
  }, [pageSize, filteredEntries.length, filters.employeeId, filters.leaveDate]);

  const pagedEntries = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  }, [filteredEntries, page, pageSize]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.employeeIds.length) nextErrors.employeeIds = 'Select at least one employee';
    if (!form.leaveDate) nextErrors.leaveDate = 'Leave date is required';
    if (Object.keys(nextErrors).length) {
      setFormErrors(nextErrors);
      return;
    }
    setFormErrors({});
    setSaving(true);
    try {
      if (editingId) {
        const payload = { employeeId: Number(form.employeeIds[0]), leaveDate: form.leaveDate };
        const updated = await request({ path: `/api/employees/leave/${editingId}`, method: 'PUT', body: payload, token });
        setEntries((prev) => prev.map((entry) => (entry.id === editingId ? updated : entry)));
      } else if (form.employeeIds.length === 1) {
        const payload = { employeeId: Number(form.employeeIds[0]), leaveDate: form.leaveDate };
        const created = await request({ path: '/api/employees/leave', method: 'POST', body: payload, token });
        setEntries((prev) => [created, ...prev]);
      } else {
        const payload = {
          employeeIds: form.employeeIds,
          startDate: form.leaveDate,
          endDate: form.leaveDate,
        };
        await request({ path: '/api/employees/leave/bulk', method: 'POST', body: payload, token });
        loadEntries();
      }
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
    setForm({ employeeIds: [String(entry.employeeId)], leaveDate: entry.leaveDate });
    setFormErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (entry) => {
    const confirmed = window.confirm(`Delete leave for ${entry.employeeName} on ${formatDateDmy(entry.leaveDate)}?`);
    if (!confirmed) return;
    try {
      await request({ path: `/api/employees/leave/${entry.id}`, method: 'DELETE', token });
      setEntries((prev) => prev.filter((item) => item.id !== entry.id));
      toast.success('Leave deleted');
      setPage(1);
      onChanged?.();
    } catch (err) {
      setError(err.message || 'Unable to delete leave');
    }
  };

  const handleEmployeeChange = (_event, value) => {
    if (editingId) {
      const nextValue = Array.isArray(value) ? value[0] : value;
      setForm((prev) => ({ ...prev, employeeIds: nextValue?.id ? [String(nextValue.id)] : [] }));
    } else {
      const list = Array.isArray(value) ? value : value ? [value] : [];
      setForm((prev) => ({ ...prev, employeeIds: list.map((item) => String(item.id)) }));
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="glass-panel space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Leave Management</p>
            <p className="text-xs text-slate-400">Select one or many employees, apply a single date.</p>
          </div>
          {editingId ? (
            <button type="button" className="text-sm font-semibold text-brand-accent hover:underline" onClick={resetForm}>
              Cancel edit
            </button>
          ) : null}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4"
          ref={formRef}
        >
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="leave-employee">
                Employees <span className="font-semibold text-rose-500">*</span>
              </label>
              <Autocomplete
                id="leave-employee"
                multiple={!editingId}
                options={employees}
                loading={!employees.length && !error}
                value={editingId ? selectedEmployees[0] || null : selectedEmployees}
                onChange={handleEmployeeChange}
                getOptionLabel={(option) =>
                  option?.name ? `${option.name}${option.department ? ` (${option.department})` : ''}` : ''
                }
                isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                renderOption={(props, option) => (
                  <li {...props} key={`assign-${option.id ?? option.name}`}>{option?.name || ''}</li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={editingId ? 'Select employee' : 'Select one or more employees'}
                    size="small"
                    margin="dense"
                    error={Boolean(formErrors.employeeIds)}
                    helperText={formErrors.employeeIds || ' '}
                    sx={{
                      '& .MuiInputBase-root': {
                        borderRadius: '0.75rem',
                        fontSize: '0.875rem',
                      },
                    }}
                    FormHelperTextProps={{ sx: { m: 0, mt: 0.5 } }}
                  />
                )}
                disabled={saving}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="leave-date">
                Leave Date <span className="font-semibold text-rose-500">*</span>
              </label>
              <div className="mt-2">
                <DatePicker
                  value={dayjs(form.leaveDate, ISO_DATE_FORMAT)}
                  onChange={(value) => setForm((prev) => ({ ...prev, leaveDate: value ? value.format(ISO_DATE_FORMAT) : '' }))}
                  format={DISPLAY_DATE_FORMAT}
                  minDate={dayjs()}
                  slotProps={{
                    textField: {
                      size: 'small',
                      placeholder: 'DD/MM/YYYY',
                      helperText: formErrors.leaveDate || ' ',
                      error: Boolean(formErrors.leaveDate),
                      sx: {
                        '& .MuiInputBase-root': { borderRadius: '0.75rem', fontSize: '0.875rem' },
                      },
                      FormHelperTextProps: { sx: { m: 0, mt: 0.5 } },
                    },
                  }}
                  disabled={saving}
                />
              </div>
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
            {editingId ? (
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>

        {error && !Object.keys(formErrors).length ? <p className="text-sm text-rose-600">{error}</p> : null}

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filter Leave Records</p>
            {(filters.employeeId || filters.leaveDate) && (
              <button
                type="button"
                className="text-xs font-semibold text-brand-accent hover:underline"
                onClick={() => setFilters({ employeeId: '', leaveDate: '' })}
              >
                Clear Filters
              </button>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="filter-employee">
                Employee
              </label>
              <Autocomplete
                id="filter-employee"
                options={employees}
                value={filterEmployeeValue}
                onChange={(_event, value) => {
                  setFilters((prev) => ({ ...prev, employeeId: value?.id ? String(value.id) : '' }));
                }}
                getOptionLabel={(option) =>
                  option?.name ? `${option.name}${option.department ? ` (${option.department})` : ''}` : ''
                }
                isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                renderOption={(props, option) => (
                  <li {...props} key={`filter-${option.id ?? option.name}`}>{option?.name || ''}</li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="All employees"
                    size="small"
                    margin="dense"
                    sx={{
                      '& .MuiInputBase-root': { borderRadius: '0.75rem', fontSize: '0.875rem' },
                    }}
                  />
                )}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="filter-date">
                Leave Date
              </label>
              <div className="mt-2">
                <DatePicker
                  value={filters.leaveDate ? dayjs(filters.leaveDate, ISO_DATE_FORMAT) : null}
                  onChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      leaveDate: value ? value.format(ISO_DATE_FORMAT) : '',
                    }))
                  }
                  format={DISPLAY_DATE_FORMAT}
                  slotProps={{
                    textField: {
                      size: 'small',
                      placeholder: 'DD/MM/YYYY',
                      sx: { '& .MuiInputBase-root': { borderRadius: '0.75rem', fontSize: '0.875rem' } },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Employee</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Department</th>
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
                        {entry.department || employeeLookup[entry.employeeId]?.department || '—'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-slate-700">{formatDateNamedMonth(entry.leaveDate)}</td>
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
        totalPages={Math.max(1, Math.ceil((filteredEntries.length || 0) / pageSize))}
        onPageChange={setPage}
        totalItems={filteredEntries.length}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />
      </div>
    </LocalizationProvider>
  );
}
