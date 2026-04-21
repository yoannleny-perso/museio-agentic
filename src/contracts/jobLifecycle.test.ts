import { describe, expect, it } from 'vitest';

import {
  getAutoSyncedJobStatus,
  getCanonicalJobStatus,
  identifyJobsNeedingStatusSync,
  isJobLive,
} from './jobLifecycle';
import { JOB_STATUS } from './jobs';

describe('job lifecycle contracts', () => {
  const now = new Date('2026-04-14T12:00:00');

  it('preserves draft and terminal states', () => {
    expect(
      getCanonicalJobStatus(
        {
          date: '2026-04-20',
          start_time: '18:00:00',
          end_time: '21:00:00',
        },
        JOB_STATUS.paid
      )
    ).toBe(JOB_STATUS.paid);

    expect(
      getCanonicalJobStatus(
        {
          date: '2026-04-20',
          start_time: '18:00:00',
          end_time: '21:00:00',
        },
        JOB_STATUS.upcoming,
        { isDraft: true }
      )
    ).toBe(JOB_STATUS.drafted);
  });

  it('syncs scheduled statuses when time has moved on', () => {
    expect(
      getAutoSyncedJobStatus(
        {
          date: '2026-04-10',
          start_time: '18:00:00',
          end_time: '21:00:00',
          status: JOB_STATUS.upcoming,
        },
        now
      )
    ).toBe(JOB_STATUS.past);

    expect(
      getAutoSyncedJobStatus(
        {
          date: '2026-04-20',
          start_time: '18:00:00',
          end_time: '21:00:00',
          status: JOB_STATUS.requested,
        },
        now
      )
    ).toBeNull();
  });

  it('identifies only jobs that actually need status updates', () => {
    const result = identifyJobsNeedingStatusSync(
      [
        {
          id: '1',
          date: '2026-04-10',
          start_time: '18:00:00',
          end_time: '21:00:00',
          status: JOB_STATUS.upcoming,
        },
        {
          id: '2',
          date: '2026-04-20',
          start_time: '18:00:00',
          end_time: '21:00:00',
          status: JOB_STATUS.requested,
        },
      ],
      now
    );

    expect(result.jobsToUpdate).toEqual([
      expect.objectContaining({ id: '1', status: JOB_STATUS.past }),
    ]);
    expect(result.unchangedJobs).toEqual([
      expect.objectContaining({ id: '2', status: JOB_STATUS.requested }),
    ]);
  });

  it('detects live jobs only during their scheduled window', () => {
    expect(
      isJobLive(
        {
          date: '2026-04-14',
          start_time: '11:00:00',
          end_time: '13:00:00',
          status: JOB_STATUS.upcoming,
        },
        now
      )
    ).toBe(true);

    expect(
      isJobLive(
        {
          date: '2026-04-14',
          start_time: '11:00:00',
          end_time: '13:00:00',
          status: JOB_STATUS.paid,
        },
        now
      )
    ).toBe(false);
  });
});
