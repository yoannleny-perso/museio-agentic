import {
  JOB_STATUS,
  type JobStatus,
} from './jobs.ts';

export interface JobScheduleInput {
  date: string;
  end_date?: string | null;
  start_time: string;
  end_time: string;
}

export interface JobLifecycleInput extends JobScheduleInput {
  status?: JobStatus | string | null;
}

export const TERMINAL_JOB_STATUSES = [
  JOB_STATUS.invoiceSent,
  JOB_STATUS.paid,
  JOB_STATUS.deleted,
] as const satisfies readonly JobStatus[];

export const SCHEDULE_MANAGED_JOB_STATUSES = [
  JOB_STATUS.upcoming,
  JOB_STATUS.past,
] as const satisfies readonly JobStatus[];

const TERMINAL_JOB_STATUS_SET = new Set<string>(TERMINAL_JOB_STATUSES);
const SCHEDULE_MANAGED_JOB_STATUS_SET = new Set<string>(
  SCHEDULE_MANAGED_JOB_STATUSES
);

export const isTerminalJobStatus = (status: unknown): status is JobStatus =>
  typeof status === 'string' && TERMINAL_JOB_STATUS_SET.has(status);

export const isScheduleManagedJobStatus = (
  status: unknown
): status is JobStatus =>
  typeof status === 'string' && SCHEDULE_MANAGED_JOB_STATUS_SET.has(status);

export const getEffectiveJobEndDate = (job: JobScheduleInput) =>
  job.end_date || job.date;

export const getJobStartDateTime = (job: JobScheduleInput) =>
  new Date(`${job.date}T${job.start_time}`);

export const getJobEndDateTime = (job: JobScheduleInput) =>
  new Date(`${getEffectiveJobEndDate(job)}T${job.end_time}`);

export const getScheduledJobStatus = (
  job: JobScheduleInput,
  now: Date = new Date()
): JobStatus =>
  getJobEndDateTime(job) < now ? JOB_STATUS.past : JOB_STATUS.upcoming;

interface CanonicalStatusOptions {
  isDraft?: boolean;
  preserveRequested?: boolean;
  now?: Date;
}

export const getCanonicalJobStatus = (
  job: JobScheduleInput,
  currentStatus?: JobStatus | null,
  options: CanonicalStatusOptions = {}
): JobStatus => {
  const {
    isDraft = false,
    preserveRequested = true,
    now = new Date(),
  } = options;

  if (isDraft) {
    return JOB_STATUS.drafted;
  }

  if (currentStatus && isTerminalJobStatus(currentStatus)) {
    return currentStatus;
  }

  if (preserveRequested && currentStatus === JOB_STATUS.requested) {
    return JOB_STATUS.requested;
  }

  return getScheduledJobStatus(job, now);
};

export const getAutoSyncedJobStatus = (
  job: JobLifecycleInput,
  now: Date = new Date()
): JobStatus | null => {
  if (!isScheduleManagedJobStatus(job.status)) {
    return null;
  }

  const nextStatus = getScheduledJobStatus(job, now);
  return nextStatus === job.status ? null : nextStatus;
};

export const identifyJobsNeedingStatusSync = <T extends JobLifecycleInput>(
  jobs: T[],
  now: Date = new Date()
) => {
  const jobsToUpdate: T[] = [];
  const unchangedJobs: T[] = [];

  jobs.forEach((job) => {
    const nextStatus = getAutoSyncedJobStatus(job, now);

    if (!nextStatus) {
      unchangedJobs.push(job);
      return;
    }

    jobsToUpdate.push({
      ...job,
      status: nextStatus,
    });
  });

  return { jobsToUpdate, unchangedJobs };
};

export const isJobLive = (
  job: JobLifecycleInput,
  now: Date = new Date()
) => {
  if (job.status && job.status !== JOB_STATUS.upcoming) {
    return false;
  }

  const jobStartDateTime = getJobStartDateTime(job);
  const jobEndDateTime = getJobEndDateTime(job);

  return now >= jobStartDateTime && now <= jobEndDateTime;
};
