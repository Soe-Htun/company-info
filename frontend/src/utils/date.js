const namedMonthFormatter = new Intl.DateTimeFormat('en-SG', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
});

const dmyFormatter = new Intl.DateTimeFormat('en-GB', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const monthDayFormatter = new Intl.DateTimeFormat('en-SG', {
  month: 'short',
  day: '2-digit',
});

const safeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

export const formatDateNamedMonth = (value) => {
  const date = safeDate(value);
  if (!date) return '—';
  const parts = namedMonthFormatter.formatToParts(date).reduce((acc, part) => {
    if (part.type === 'month' || part.type === 'day' || part.type === 'year') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});
  return `${parts.month ?? ''} ${parts.day ?? ''} ${parts.year ?? ''}`.trim();
};

export const formatDateDmy = (value) => {
  const date = safeDate(value);
  if (!date) return '—';
  return dmyFormatter.format(date);
};

export const formatMonthDay = (value) => {
  const date = safeDate(value);
  if (!date) return '—';
  return monthDayFormatter.format(date);
};
