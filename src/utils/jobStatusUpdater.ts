
import { Job, JobStatus } from '@/types';
import {
  getAutoSyncedJobStatus,
  getCanonicalJobStatus,
  identifyJobsNeedingStatusSync,
  isJobLive as getIsJobLive,
  JOB_STATUS,
} from '@/contracts';

/**
 * Evaluates and returns the appropriate job status based on job data and current status
 * 
 * @param jobData The job data with potentially updated date/time information
 * @param currentStatus The current status of the job
 * @param isDraft Whether this is being saved as a draft
 * @returns The appropriate job status
 */
export const evaluateJobStatus = (
  jobData: Partial<Job> & { date: string; end_date?: string; start_time: string; end_time: string },
  currentStatus?: JobStatus,
  isDraft: boolean = false
): JobStatus => {
  return getCanonicalJobStatus(jobData, currentStatus, { isDraft });
};

/**
 * Checks if an "upcoming" job's date and time have passed and should be updated to "past"
 * 
 * @param job The job to check
 * @returns boolean True if the job needs to be updated to "past"
 */
export const shouldUpdateToPast = (job: Job): boolean => {
  return getAutoSyncedJobStatus(job) === JOB_STATUS.past;
};

/**
 * Checks if a "requested" job should be updated to "upcoming"
 * 
 * @param job The job to check
 * @returns boolean True if the job needs to be updated to "upcoming"
 */
export const shouldUpdateToUpcoming = (job: Job): boolean => {
  return getAutoSyncedJobStatus(job) === JOB_STATUS.upcoming;
};

/**
 * Identifies which jobs in an array need to be updated - both "upcoming" to "past" and "requested" to "upcoming"
 * 
 * @param jobs Array of jobs to check
 * @returns Object containing separate arrays for jobs that need updates and unmodified jobs
 */
export const identifyJobsToUpdate = (jobs: Job[]): { 
  jobsToUpdate: Job[], 
  unchangedJobs: Job[] 
} => {
  return identifyJobsNeedingStatusSync(jobs);
};

/**
 * Checks if an "upcoming" job is currently ongoing (between start and end time)
 * 
 * @param job The job to check
 * @returns boolean True if the job is currently happening
 */
export const isJobLive = (job: Job): boolean => {
  return getIsJobLive(job);
};
