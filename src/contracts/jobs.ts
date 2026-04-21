export const JOB_STATUSES = [
  'requested',
  'drafted',
  'upcoming',
  'past',
  'invoice-sent',
  'paid',
  'deleted',
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STATUS = {
  requested: 'requested',
  drafted: 'drafted',
  upcoming: 'upcoming',
  past: 'past',
  invoiceSent: 'invoice-sent',
  paid: 'paid',
  deleted: 'deleted',
} as const satisfies Record<string, JobStatus>;

export const JOB_TAB_VALUES = [
  'requests',
  'upcoming',
  'invoice-sent',
  'paid',
  'drafted',
  'past',
] as const;

export type JobTab = (typeof JOB_TAB_VALUES)[number];

export const JOB_TAB = {
  requests: 'requests',
  upcoming: 'upcoming',
  invoiceSent: 'invoice-sent',
  paid: 'paid',
  drafted: 'drafted',
  past: 'past',
} as const satisfies Record<string, JobTab>;

export const DEFAULT_JOB_TAB: JobTab = 'upcoming';
export const JOB_TAB_QUERY_PARAM = 'tab';

export const BOOKING_AVAILABILITY_BLOCKING_JOB_STATUSES = [
  'upcoming',
  'invoice-sent',
  'paid',
  'past',
] as const satisfies readonly JobStatus[];

const JOB_STATUS_SET = new Set<string>(JOB_STATUSES);
const JOB_TAB_SET = new Set<string>(JOB_TAB_VALUES);

export const isJobStatus = (value: unknown): value is JobStatus =>
  typeof value === 'string' && JOB_STATUS_SET.has(value);

export const isJobTab = (value: unknown): value is JobTab =>
  typeof value === 'string' && JOB_TAB_SET.has(value);

export const normalizeJobTab = (value: string | null | undefined): JobTab =>
  isJobTab(value) ? value : DEFAULT_JOB_TAB;
