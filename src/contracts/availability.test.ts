import { describe, expect, it } from 'vitest';

import {
  addMinutesToTime,
  calculateAvailableSlots,
  doesDateOverlapAvailabilityRange,
  filterSlotsByMinimumNotice,
  getBlockedTimesForDate,
  subtractMinutesFromTime,
} from './availability';

describe('availability contracts', () => {
  it('detects overlap for multi-day bookings', () => {
    expect(
      doesDateOverlapAvailabilityRange('2026-04-15', {
        date: '2026-04-14',
        end_date: '2026-04-16',
      })
    ).toBe(true);

    expect(
      doesDateOverlapAvailabilityRange('2026-04-17', {
        date: '2026-04-14',
        end_date: '2026-04-16',
      })
    ).toBe(false);
  });

  it('maps overnight ranges onto each affected day', () => {
    expect(
      getBlockedTimesForDate('2026-04-15', {
        date: '2026-04-15',
        end_date: '2026-04-16',
        start: '23:00',
        end: '02:00',
      })
    ).toEqual([{ start: '23:00:00', end: '24:00:00' }]);

    expect(
      getBlockedTimesForDate('2026-04-16', {
        date: '2026-04-15',
        end_date: '2026-04-16',
        start: '23:00',
        end: '02:00',
      })
    ).toEqual([{ start: '00:00:00', end: '02:00:00' }]);
  });

  it('applies buffer time when calculating slots', () => {
    expect(
      calculateAvailableSlots(
        '09:00:00',
        '17:00:00',
        [{ start: '12:00:00', end: '13:00:00' }],
        {
          buffer_time_minutes: 15,
          min_notice_hours: 24,
          enable_breaks: false,
          break_duration_minutes: 30,
        }
      )
    ).toEqual([
      { start: '09:00:00', end: '11:45:00' },
      { start: '13:15:00', end: '17:00:00' },
    ]);
  });

  it('subtracts break time from otherwise open windows', () => {
    expect(
      calculateAvailableSlots(
        '09:00:00',
        '17:00:00',
        [],
        {
          buffer_time_minutes: 0,
          min_notice_hours: 24,
          enable_breaks: true,
          break_duration_minutes: 30,
        }
      )
    ).toEqual([{ start: '09:00:00', end: '16:30:00' }]);
  });

  it('filters out slots that violate minimum notice without hiding the full day', () => {
    expect(
      filterSlotsByMinimumNotice(
        '2026-04-16',
        [
          { start: '09:00:00', end: '10:00:00' },
          { start: '18:00:00', end: '19:00:00' },
        ],
        24,
        new Date('2026-04-15T12:00:00')
      )
    ).toEqual([{ start: '18:00:00', end: '19:00:00' }]);
  });

  it('normalizes time arithmetic helpers', () => {
    expect(addMinutesToTime('09:30:00', 45)).toBe('10:15:00');
    expect(subtractMinutesFromTime('09:30:00', 45)).toBe('08:45:00');
    expect(subtractMinutesFromTime('00:15:00', 45)).toBe('00:00:00');
  });
});
