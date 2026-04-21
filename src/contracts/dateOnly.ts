const DATE_ONLY_PATTERN = /^(\d{4}-\d{2}-\d{2})/;

const pad = (value: number) => String(value).padStart(2, '0');

export const dateOnlyFromDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const normalizeDateOnlyString = (
  value: string | null | undefined
) => {
  if (!value) {
    return '';
  }

  const trimmed = value.trim();
  const directMatch = trimmed.match(DATE_ONLY_PATTERN);
  if (directMatch) {
    return directMatch[1];
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return dateOnlyFromDate(parsed);
};

export const parseDateOnlyString = (value: string | null | undefined) => {
  const normalized = normalizeDateOnlyString(value);
  if (!normalized) {
    return null;
  }

  const [year, month, day] = normalized.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const getDateOnlyRangeEnd = (
  startDate: string,
  endDate?: string | null
) => normalizeDateOnlyString(endDate) || normalizeDateOnlyString(startDate);

export const isDateOnlyRangeMultiDay = (
  startDate: string,
  endDate?: string | null
) => {
  const normalizedStart = normalizeDateOnlyString(startDate);
  if (!normalizedStart) {
    return false;
  }

  return getDateOnlyRangeEnd(normalizedStart, endDate) !== normalizedStart;
};

export const formatDateOnlyForLocale = (
  value: string | null | undefined,
  locales = 'en-US',
  options?: Intl.DateTimeFormatOptions
) => {
  const parsed = parseDateOnlyString(value);
  return parsed ? parsed.toLocaleDateString(locales, options) : '';
};

export const formatDateOnlyRangeForLocale = (
  startDate: string,
  endDate?: string | null,
  locales = 'en-US',
  options?: Intl.DateTimeFormatOptions
) => {
  const normalizedStart = normalizeDateOnlyString(startDate);
  if (!normalizedStart) {
    return '';
  }

  const normalizedEnd = getDateOnlyRangeEnd(normalizedStart, endDate);
  const startLabel = formatDateOnlyForLocale(normalizedStart, locales, options);

  if (normalizedEnd === normalizedStart) {
    return startLabel;
  }

  const endLabel = formatDateOnlyForLocale(normalizedEnd, locales, options);
  return `${startLabel} - ${endLabel}`;
};
