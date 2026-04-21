import { describe, expect, it } from 'vitest';

import {
  formatDateOnlyRangeForLocale,
  getDateOnlyRangeEnd,
  normalizeDateOnlyString,
  parseDateOnlyString,
} from './dateOnly';

describe('dateOnly contracts', () => {
  it('normalizes date-only strings from stored ISO datetimes', () => {
    expect(normalizeDateOnlyString('2026-04-15T00:00:00.000Z')).toBe('2026-04-15');
    expect(normalizeDateOnlyString('2026-04-15')).toBe('2026-04-15');
  });

  it('parses normalized date-only values without timezone drift', () => {
    const parsed = parseDateOnlyString('2026-04-15');

    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(3);
    expect(parsed?.getDate()).toBe(15);
  });

  it('formats date ranges only when the range spans multiple dates', () => {
    expect(getDateOnlyRangeEnd('2026-04-15', null)).toBe('2026-04-15');
    expect(
      formatDateOnlyRangeForLocale('2026-04-15', '2026-04-16', 'en-US')
    ).toContain(' - ');
  });
});
