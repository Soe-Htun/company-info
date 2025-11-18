import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const STATUS_OPTIONS = ['Active', 'On Leave'];
const GENDER_OPTIONS = ['Male', 'Female'];
const ISO_DATE_FORMAT = 'YYYY-MM-DD';
const DISPLAY_DATE_FORMAT = 'DD/MM/YYYY';
const TODAY = dayjs();
const BIRTHDAY_MIN_DATE = dayjs().subtract(80, 'year');
const DEFAULT_DEPARTMENT = 'ဖဲဝေ';
const STATIC_DEPARTMENTS = ['သန့်ရှင်းရေး'];
const EXCLUDED_DEPARTMENTS = new Set(['ဆရာ']);

const toDayjsValue = (value) => {
  if (!value) return null;
  const parsed = dayjs(value, ISO_DATE_FORMAT, true);
  return parsed.isValid() ? parsed : null;
};

const toIsoString = (value) => {
  if (!value) return '';
  return value.isValid() ? value.format(ISO_DATE_FORMAT) : '';
};

const sanitizeDepartment = (value) => {
  if (!value || EXCLUDED_DEPARTMENTS.has(value)) return DEFAULT_DEPARTMENT;
  return value;
};

const EMPTY_FORM = {
  name: '',
  department: DEFAULT_DEPARTMENT,
  status: 'Active',
  gender: 'Female',
  birthday: '',
  hireDate: '',
  leaveDate: '',
  address: '',
  phone: '',
};

function toForm(employee) {
  if (!employee) return EMPTY_FORM;
  return {
    name: employee.name || '',
    department: sanitizeDepartment(employee.department),
    status: employee.status || 'Active',
    gender: employee.gender || 'Female',
    birthday: employee.birthday || '',
    hireDate: employee.hireDate || '',
    leaveDate: employee.status === 'On Leave' ? ISO_DATE_FORMAT && dayjs().format(ISO_DATE_FORMAT) : '',
    address: employee.address || '',
    phone: employee.phone || '',
  };
}

export function EmployeeEditor({
  mode = 'create',
  employee,
  onSubmit,
  onCancel,
  busy,
  error,
  helper,
  departments = [],
  fieldErrors = {},
  onClearFieldError,
}) {
  const [form, setForm] = useState(toForm(employee));
  const [departmentsTouched, setDepartmentsTouched] = useState(false);
  const [localErrors, setLocalErrors] = useState({});
  const isOnLeave = form.status === 'On Leave';
  const getInputClasses = (field) => {
    const hasError = Boolean(fieldErrors[field] || localErrors[field]);
    const base =
      'mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition';
    const normal = 'border-slate-200 focus:border-brand-accent focus:ring-brand-soft';
    const errored = 'border-rose-400 focus:border-rose-500 focus:ring-rose-200';
    return `${base} ${hasError ? errored : normal}`;
  };
  const availableDepartments = useMemo(() => {
    const set = new Set(
      [...STATIC_DEPARTMENTS, ...departments.filter(Boolean)].filter((dept) => !EXCLUDED_DEPARTMENTS.has(dept)),
    );
    if (form.department && !EXCLUDED_DEPARTMENTS.has(form.department)) {
      set.add(form.department);
    }
    return Array.from(set);
  }, [departments, form.department]);

  useEffect(() => {
    setForm(toForm(employee));
    setDepartmentsTouched(false);
    setLocalErrors({});
  }, [employee]);

  useEffect(() => {
    if (!form.department && availableDepartments.length && !departmentsTouched) {
      setForm((prev) => ({ ...prev, department: availableDepartments[0] }));
    }
  }, [availableDepartments, form.department, departmentsTouched]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    onClearFieldError?.(name);
    setLocalErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setForm((prev) => {
      if (name === 'status') {
        const nextStatus = value;
        return {
          ...prev,
          status: nextStatus,
          leaveDate:
            nextStatus === 'On Leave' ? (prev.leaveDate || dayjs().format(ISO_DATE_FORMAT)) : '',
        };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextLocalErrors = {};
    if (!form.name.trim()) {
      nextLocalErrors.name = 'Name is required';
    }
    if (!form.department.trim()) {
      nextLocalErrors.department = 'Department is required';
    }
    if (!form.birthday) {
      nextLocalErrors.birthday = 'Birthday is required';
    }
    const leaveDateValue =
      isOnLeave
        ? form.leaveDate || dayjs().format(ISO_DATE_FORMAT)
        : undefined;
    if (isOnLeave && !leaveDateValue) {
      nextLocalErrors.leaveDate = 'Leave date is required';
    }

    if (Object.keys(nextLocalErrors).length) {
      setLocalErrors(nextLocalErrors);
      return;
    }
    setLocalErrors({});

    const payload = {
      name: form.name.trim(),
      department: form.department.trim(),
      status: form.status || 'Active',
      gender: form.gender || 'Male',
      birthday: form.birthday || undefined,
      hireDate: form.hireDate || undefined,
      leaveDate: leaveDateValue,
      address: form.address.trim(),
      phone: form.phone ? form.phone.replace(/\D/g, '') : '',
    };
    if (payload.birthday) {
      const birthDate = new Date(payload.birthday);
      if (!Number.isNaN(birthDate.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const hasHadBirthday =
          today.getMonth() > birthDate.getMonth() ||
          (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
        if (!hasHadBirthday) {
          age -= 1;
        }
        payload.age = age;
      }
    }
    if (!payload.department && availableDepartments.length) {
      payload.department = availableDepartments[0];
    }
    if (!payload.department) {
      return;
    }
    onSubmit(payload);
  };

  const handleDatePickerChange = (field) => (value) => {
    onClearFieldError?.(field);
    setLocalErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setForm((prev) => ({
      ...prev,
      [field]: toIsoString(value),
    }));
  };

  const getDatePickerSlots = (field, isRequired = false) => ({
    textField: {
      fullWidth: true,
      size: 'small',
      placeholder: 'DD/MM/YYYY',
      helperText: fieldErrors[field] || localErrors[field] || ' ',
      error: Boolean(fieldErrors[field] || localErrors[field]),
      inputProps: {
        placeholder: 'DD/MM/YYYY',
        readOnly: false,
        required: isRequired || undefined,
      },
      sx: {
        '& .MuiInputBase-root': {
          borderRadius: '0.75rem',
          fontSize: '0.875rem',
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont',
        },
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: '#e2e8f0',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: '#93c5fd',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: '#2563eb',
        },
      },
    },
    actionBar: { actions: ['clear'] },
  });

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="emp-name">
              Full Name <span className="font-semibold text-rose-500">*</span>
            </label>
            <input
              id="emp-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              className={getInputClasses('name')}
            />
            {fieldErrors.name || localErrors.name ? (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.name || localErrors.name}</p>
            ) : null}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Department <span className="font-semibold text-rose-500"> *</span>
            </p>
            {availableDepartments.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {availableDepartments.map((dept) => {
                  const isActive = form.department === dept;
                  return (
                    <button
                      key={dept}
                      type="button"
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${isActive
                          ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
                          : 'border-slate-200 text-slate-600 hover:border-brand-accent/40'
                        }`}
                      onClick={() => {
                        onClearFieldError?.('department');
                        setForm((prev) => ({ ...prev, department: dept }));
                        setDepartmentsTouched(true);
                      }}
                    >
                      {dept}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">No departments available yet.</p>
            )}
            {localErrors.department ? <p className="mt-1 text-xs text-rose-600">{localErrors.department}</p> : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 pb-2">
          <div className="md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gender</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {GENDER_OPTIONS.map((option) => {
                const isActive = form.gender === option;
                return (
                  <button
                    key={option}
                    type="button"
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${isActive
                        ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
                        : 'border-slate-200 text-slate-600 hover:border-brand-accent/40'
                      }`}
                    onClick={() => setForm((prev) => ({ ...prev, gender: option }))}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="emp-birthday">
              Birthday <span className="font-semibold text-rose-500">*</span>
            </label>
            <div className="mt-1">
              <DatePicker
                value={toDayjsValue(form.birthday)}
                onChange={handleDatePickerChange('birthday')}
                format={DISPLAY_DATE_FORMAT}
                disableFuture
                minDate={BIRTHDAY_MIN_DATE}
                maxDate={TODAY}
                openTo="year"
                views={['year', 'month', 'day']}
                clearable
                slotProps={getDatePickerSlots('birthday')}
              />
            </div>
            {localErrors.birthday ? <p className="mt-1 text-xs text-rose-600">{localErrors.birthday}</p> : null}
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="emp-hire-date">
              Start Date
            </label>
            <div className="mt-1">
              <DatePicker
                value={toDayjsValue(form.hireDate)}
                onChange={handleDatePickerChange('hireDate')}
                format={DISPLAY_DATE_FORMAT}
                disableFuture
                maxDate={TODAY}
                views={['year', 'month', 'day']}
                clearable
                slotProps={getDatePickerSlots('hireDate')}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className='pb-8'>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {['Active', 'On Leave'].map((statusOption) => {
                const isActive = form.status === statusOption;
                return (
                  <button
                    key={statusOption}
                    type="button"
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${isActive
                        ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
                        : 'border-slate-200 text-slate-600 hover:border-brand-accent/40'
                      }`}
                    onClick={() => handleChange({ target: { name: 'status', value: statusOption } })}
                  >
                    {statusOption}
                  </button>
                );
              })}
            </div>
          </div>
          {isOnLeave ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Leave Date <span className="font-semibold text-rose-500">*</span>
              </p>
              <div className="mt-1">
                <DatePicker
                  value={toDayjsValue(form.leaveDate) || TODAY}
                  onChange={handleDatePickerChange('leaveDate')}
                  format={DISPLAY_DATE_FORMAT}
                  slotProps={getDatePickerSlots('leaveDate', true)}
                  minDate={TODAY}
                  disableFuture={false}
                />
              </div>
              {fieldErrors.leaveDate || localErrors.leaveDate ? (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.leaveDate || localErrors.leaveDate}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="emp-address">
              Address
            </label>
            <input
              id="emp-address"
              name="address"
              type="text"
              value={form.address}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-soft"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="emp-phone">
              Phone
            </label>
            <input
              id="emp-phone"
              name="phone"
              type="text"
              value={form.phone}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-soft"
            />
          </div>
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {helper ? <p className="text-sm text-slate-500">{helper}</p> : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
          >
            {busy ? 'Saving…' : mode === 'edit' ? 'Update Employee' : 'Create Employee'}
          </button>
        </div>
      </form>
    </LocalizationProvider>
  );
}
