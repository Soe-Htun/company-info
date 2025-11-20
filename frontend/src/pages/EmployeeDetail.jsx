import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { request } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatYearsDuration, formatDateDmy, formatDateNamedMonth } from '../utils/date';
import { UserMenu } from '../components/UserMenu';

export default function EmployeeDetail() {
  const { id } = useParams();
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [status, setStatus] = useState({ loading: true, error: null });
  const [leaveHistory, setLeaveHistory] = useState(null);

  useEffect(() => {
    if (!token) return;
    setStatus({ loading: true, error: null });
    request({ path: `/api/employees/${id}`, token })
      .then((data) => {
        setEmployee(data);
        setLeaveHistory(data.leaveHistory || null);
        setStatus({ loading: false, error: null });
      })
      .catch((err) => {
        setStatus({ loading: false, error: err.message });
      });
  }, [id, token]);

  const profileFields = useMemo(() => {
    const fields = [
      { label: 'Gender', value: employee?.gender },
      { label: 'Birthday', value: formatDateNamedMonth(employee?.birthday) },
      { label: 'Age', value: formatYearsDuration(employee?.birthday) },
      { label: 'Start Date', value: formatDateDmy(employee?.hireDate) },
    ];
    if (employee?.hireDate) {
      fields.push({ label: 'Working Years', value: formatYearsDuration(employee?.hireDate) });
    }
    return fields;
  }, [employee]);

  const contactFields = useMemo(
    () => [
      { label: 'Phone', value: employee?.phone || '—' },
      { label: 'Address', value: employee?.address || '—' },
    ],
    [employee],
  );

  const leaveList = leaveHistory?.dates || [];
  const leaveHeader =
    leaveHistory?.periodStart && leaveHistory?.periodEnd
      ? `This company month (${formatDateNamedMonth(leaveHistory.periodStart)} → ${formatDateNamedMonth(leaveHistory.periodEnd)})`
      : 'This company month';

  return (
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

      <main className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-6">
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            <span aria-hidden="true">←</span>
            Back
          </button>
          <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-accent">Employee Detail</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900">{employee?.name || 'Loading…'}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { label: 'Code', value: employee?.empCode },
                { label: 'Department', value: employee?.department },
                { label: 'Status', value: employee?.status },
              ].map((tag) => (
                <span
                  key={tag.label}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {tag.label}: <span className="ml-2 text-slate-900">{tag.value || '—'}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
        {status.error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{status.error}</div>
        ) : null}
        {status.loading ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 text-sm text-slate-500">Loading employee…</div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Profile Snapshot</p>
                <dl className="mt-4 space-y-3 text-sm text-slate-700">
                  {profileFields.map((field) => (
                    <div key={field.label}>
                      <dt className="font-medium text-slate-500">{field.label}</dt>
                      <dd className='text-slate-900'>{field.value ?? '—'}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact & Location</p>
                <dl className="mt-4 space-y-3 text-sm text-slate-700">
                  {contactFields.map((field) => (
                    <div key={field.label}>
                      <dt className="font-medium text-slate-500">{field.label}</dt>
                      <dd>{field.value ?? '—'}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Leave History</p>
                <p className="text-xs text-slate-500">{leaveHeader}</p>
                {!leaveList.length ? (
                  <p className="mt-3 text-sm text-slate-500">No leave recorded this period.</p>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    {leaveList.map((date) => (
                      <li
                        key={date}
                        className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                      >
                        <span className="font-medium text-slate-800">{formatDateNamedMonth(date)}</span>
                        <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                          On Leave
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
