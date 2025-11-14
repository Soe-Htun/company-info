const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'department', label: 'Department', sortable: true },
  { key: 'birthday', label: 'Birthday', sortable: true },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
];

const formatDateDmy = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

function HeaderCell({ column, sortBy, sortDir, onSort }) {
  const isActive = column.key === sortBy;
  const direction = isActive ? (sortDir === 'asc' ? '↑' : '↓') : '';
  return (
    <th
      scope="col"
      className={`whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 ${
        column.sortable ? 'cursor-pointer select-none' : ''
      }`}
      onClick={() => column.sortable && onSort(column.key)}
    >
      <span className="flex items-center gap-1">
        {column.label}
        {direction && <span className="text-[10px] text-slate-400">{direction}</span>}
      </span>
    </th>
  );
}

function RowSkeleton({ cells }) {
  return (
    <tr>
      {Array.from({ length: cells }).map((_, index) => (
        <td key={`skeleton-${index}`} className="px-3 py-3">
          <div className="h-3 animate-pulse rounded-full bg-slate-200" />
        </td>
      ))}
    </tr>
  );
}

export function EmployeeTable({
  data,
  sortBy,
  sortDir,
  onSortChange,
  loading,
  onEdit,
  onDelete,
  onDetail,
  rowOffset = 0,
}) {
  const handleSort = (column) => {
    const nextDirection = sortBy === column && sortDir === 'asc' ? 'desc' : 'asc';
    onSortChange({ sortBy: column, sortDir: nextDirection });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <HeaderCell
                  key={column.key}
                  column={column}
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading
              ? Array.from({ length: 6 }).map((_, idx) => <RowSkeleton key={`loading-${idx}`} cells={columns.length} />)
              : data.map((employee, idx) => (
                  <tr
                    key={employee.id}
                    className="cursor-pointer transition hover:bg-brand-soft/40"
                    onClick={() => onDetail?.(employee)}
                  >
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-slate-500">
                      {rowOffset + idx + 1}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <p className="font-semibold text-slate-800">{employee.name}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {employee.department}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">{formatDateDmy(employee.birthday)}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          employee.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-600'
                            : employee.status === 'On Leave'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {employee.status || 'Active'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:text-brand-accent"
                          aria-label="Edit employee"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEdit?.(employee);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 0 1 2.828 2.828l-.707.707-2.828-2.828.707-.707Z" />
                            <path d="M14 8.414 11.586 6 4 13.586V16h2.414L14 8.414Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-rose-200 p-1 text-rose-500 transition hover:text-rose-600 hover:border-rose-300"
                          aria-label="Delete employee"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDelete?.(employee);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M7 2a1 1 0 0 0-1 1v1H3.5a.5.5 0 0 0 0 1h13a.5.5 0 0 0 0-1H14V3a1 1 0 0 0-1-1H7Zm-1 5v9a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7H6Z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      {!loading && data.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-slate-500">No employees match your filters.</p>
      ) : null}
    </div>
  );
}
