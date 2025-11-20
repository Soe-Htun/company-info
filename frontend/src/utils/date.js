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

const monthDayFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
});

const safeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const calculateDurationParts = (birthday) => {
  const birthDate = safeDate(birthday);
  if (!birthDate) return null;

  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  if (dayDiff < 0) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months };
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

export const formatYearsDuration = (birthday, { blankIfInvalid = false, style = 'long' } = {}) => {
  const fallback = blankIfInvalid ? '' : '—';
  const age = calculateDurationParts(birthday);
  if (!age) return fallback;
  const { years, months } = age;

  const parts = [];
  if (years > 0) {
    const yearToken = `${years} year${years === 1 ? '' : 's'}`;
    parts.push(style === 'long' ? yearToken : `${years}y`);
  }
  if (months > 0) {
    const monthToken = `${months} month${months === 1 ? '' : 's'}`;
    parts.push(style === 'long' ? monthToken : `${months}m`);
  }

  if (!parts.length) {
    return fallback;
  }

  if (style === 'medium') {
    return parts.join(' ');
  }

  if (style === 'compact') {
    return parts.join('');
  }

  if (style === 'short') {
    return parts.join(' ');
  }

  return parts.join(' and ');
};

export const getRoundedAgeYears = (birthday) => {
  const age = calculateDurationParts(birthday);
  if (!age) return null;
  const { years, months } = age;
  return months > 6 ? years + 1 : years;
};
