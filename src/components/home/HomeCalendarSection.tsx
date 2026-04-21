import React, { useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { Job, JobStatus } from '@/types';
import { cn, formatTimeWithoutSeconds } from '@/lib/utils';
import { isJobLive } from '@/utils/jobStatusUpdater';
import { ProfileDropdown } from '@/components/ui/profile-dropdown';

interface HomeCalendarSectionProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  jobs: Job[];
  onJobClick: (job: Job) => void;
  onAddJob?: () => void;
  isProcessing?: (jobId: string) => boolean;
  onInvoiceClick?: (job: Job) => void;
}

const STATUS_PRIORITY: Record<string, number> = {
  upcoming: 1,
  past: 2,
  'invoice-sent': 3,
  drafted: 4,
  paid: 5,
};

const STATUS_BAR_CLASS: Record<string, string> = {
  upcoming: 'bg-[#7A42E8]',
  past: 'bg-[#F59E0B]',
  'invoice-sent': 'bg-orange-500',
  drafted: 'bg-[#A4A9B6]',
  paid: 'bg-[#45C05A]',
  live: 'bg-[#EA384C]',
};

const STATUS_PILL_CLASS: Record<string, string> = {
  upcoming: 'bg-[#F4EEFD] text-[#7A42E8]',
  past: 'bg-amber-50 text-amber-700',
  'invoice-sent': 'bg-orange-50 text-orange-700',
  drafted: 'bg-slate-100 text-slate-600',
  paid: 'bg-emerald-50 text-emerald-700',
  live: 'bg-red-50 text-red-700',
};

const STATUS_LABEL: Record<string, string> = {
  upcoming: 'Upcoming',
  past: 'Past',
  'invoice-sent': 'Invoice sent',
  drafted: 'Draft',
  paid: 'Paid',
  live: 'Live',
};

const getJobsForDay = (jobs: Job[], day: Date) =>
  jobs.filter((job) => {
    const jobStartDate = startOfDay(new Date(job.date));
    const jobEndDate = startOfDay(new Date(job.end_date || job.date));
    const selectedDay = startOfDay(day);

    return selectedDay >= jobStartDate && selectedDay <= jobEndDate;
  });

const getDayStatus = (jobs: Job[], day: Date): JobStatus | 'live' | null => {
  const jobsForDay = getJobsForDay(jobs, day);

  if (jobsForDay.length === 0) {
    return null;
  }

  if (jobsForDay.some((job) => isJobLive(job))) {
    return 'live';
  }

  const today = startOfDay(new Date());
  const isPastDay = isBefore(startOfDay(day), today);

  if (isPastDay) {
    if (jobsForDay.some((job) => job.status === 'past')) return 'past';
    if (jobsForDay.some((job) => job.status === 'invoice-sent')) return 'invoice-sent';
    if (jobsForDay.some((job) => job.status === 'paid')) return 'paid';
    if (jobsForDay.some((job) => job.status === 'drafted')) return 'drafted';
  } else {
    if (jobsForDay.some((job) => job.status === 'upcoming')) return 'upcoming';
    if (jobsForDay.some((job) => job.status === 'drafted')) return 'drafted';
    if (jobsForDay.some((job) => job.status === 'invoice-sent')) return 'invoice-sent';
    if (jobsForDay.some((job) => job.status === 'paid')) return 'paid';
    if (jobsForDay.some((job) => job.status === 'past')) return 'past';
  }

  return jobsForDay[0].status;
};

const sortJobsForDay = (jobs: Job[]) =>
  [...jobs].sort((a, b) => {
    const priorityA = STATUS_PRIORITY[a.status] || 999;
    const priorityB = STATUS_PRIORITY[b.status] || 999;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    return a.start_time.localeCompare(b.start_time);
  });

const getJobCardStatus = (job: Job): JobStatus | 'live' =>
  isJobLive(job) ? 'live' : job.status;

const buildJobMeta = (job: Job) => {
  const timeRange = `${formatTimeWithoutSeconds(job.start_time)} - ${formatTimeWithoutSeconds(job.end_time)}`;
  const secondary = [job.job_number, job.client || job.location].filter(Boolean).join(' • ');
  return { timeRange, secondary };
};

const HomeCalendarSection: React.FC<HomeCalendarSectionProps> = ({
  selectedDate,
  onSelectDate,
  jobs,
  onJobClick,
  onAddJob,
  onInvoiceClick,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(selectedDate));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(monthStart),
    end: endOfWeek(monthEnd),
  });

  const selectedDayJobs = useMemo(
    () => sortJobsForDay(getJobsForDay(jobs, selectedDate)),
    [jobs, selectedDate]
  );

  const handleJobCardClick = (job: Job) => {
    if (
      (job.status === 'past' || job.status === 'invoice-sent' || job.status === 'paid') &&
      onInvoiceClick
    ) {
      onInvoiceClick(job);
      return;
    }

    onJobClick(job);
  };

  return (
    <div className="min-h-full bg-[#F8F9FB] pb-6 pt-1">
      <div className="app-page-shell-wide space-y-6">
        <div className="flex items-center justify-between gap-4 px-1 py-2 sm:px-2">
          <img
            src="/museio-gradient-logo.svg"
            alt="Museio Logo"
            className="h-16 w-auto sm:h-[72px]"
          />
          <ProfileDropdown />
        </div>

        <section className="rounded-[28px] border border-[#DDDCE7] bg-white p-5 shadow-[0_10px_32px_-22px_rgba(31,36,48,0.35)] sm:p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#1F2430]">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="rounded-xl p-2 text-[#4F5868] transition-colors hover:bg-[#F4EEFD]"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="rounded-xl p-2 text-[#4F5868] transition-colors hover:bg-[#F4EEFD]"
                aria-label="Next month"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="py-2 text-center text-xs font-medium uppercase tracking-[0.18em] text-[#7A7F8C]"
              >
                {day}
              </div>
            ))}

            {calendarDays.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isPastDay = isBefore(startOfDay(day), startOfDay(new Date()));
              const jobsForDay = getJobsForDay(jobs, day);
              const jobCount = jobsForDay.length;
              const dayStatus = getDayStatus(jobs, day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => onSelectDate(day)}
                  className={cn(
                    'aspect-square rounded-2xl p-2 transition-all',
                    isSelected
                      ? 'bg-[#7A42E8] text-white shadow-[0_14px_30px_-18px_rgba(122,66,232,0.9)]'
                      : 'text-[#1F2430] hover:bg-[#F4EEFD]',
                    !isCurrentMonth && !isSelected && 'text-[#C3C7D1]',
                    isPastDay && isCurrentMonth && !isSelected && 'text-[#9CA3AF]'
                  )}
                >
                  <div className="flex h-full flex-col items-center justify-center">
                    <span className="text-sm font-semibold">{format(day, 'd')}</span>
                    {jobCount > 0 && (
                      <div className="mt-1 flex items-center gap-1">
                        {Array.from({ length: Math.min(jobCount, 3) }).map((_, index) => (
                          <span
                            key={`${day.toISOString()}-${index}`}
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              isSelected
                                ? 'bg-white'
                                : cn(
                                    STATUS_BAR_CLASS[dayStatus || 'drafted'],
                                    isPastDay && 'opacity-60'
                                  )
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-[28px] border border-[#DDDCE7] bg-white p-5 shadow-[0_10px_32px_-22px_rgba(31,36,48,0.35)] sm:p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#1F2430]">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h3>
              <p className="mt-1 text-sm text-[#7A7F8C]">
                {selectedDayJobs.length} {selectedDayJobs.length === 1 ? 'job' : 'jobs'}
              </p>
            </div>
          </div>

          {selectedDayJobs.length > 0 ? (
            <div className="space-y-6">
              <div className="space-y-4">
                {selectedDayJobs.map((job) => {
                  const displayStatus = getJobCardStatus(job);
                  const { timeRange, secondary } = buildJobMeta(job);

                  return (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => handleJobCardClick(job)}
                      className="group flex w-full items-start gap-4 rounded-[24px] border-2 border-[#DDDCE7] bg-white p-5 text-left transition-all hover:border-[#8F6EE6] hover:shadow-[0_14px_32px_-24px_rgba(122,66,232,0.75)]"
                    >
                      <div
                        className={cn(
                          'mt-0.5 h-16 w-1 rounded-full',
                          STATUS_BAR_CLASS[displayStatus]
                        )}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <h4 className="truncate text-base font-semibold text-[#1F2430] transition-colors group-hover:text-[#7A42E8]">
                            {job.title || 'Untitled job'}
                          </h4>
                          <span
                            className={cn(
                              'shrink-0 rounded-full px-3 py-1 text-xs font-semibold',
                              STATUS_PILL_CLASS[displayStatus]
                            )}
                          >
                            {STATUS_LABEL[displayStatus]}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-medium text-[#4F5868]">{timeRange}</p>
                          {secondary && (
                            <p className="text-sm text-[#7A7F8C]">{secondary}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={onAddJob}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#8F6EE6] to-[#7A42E8] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_32px_-18px_rgba(122,66,232,0.8)] transition-transform hover:-translate-y-0.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Job</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-[#DDDCE7] bg-[#FBFAFE] px-6 py-12 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#F4EEFD]">
                <CalendarIcon className="h-9 w-9 text-[#7A42E8]" />
              </div>
              <h4 className="text-base font-semibold text-[#1F2430]">No jobs scheduled</h4>
              <p className="mt-2 text-sm text-[#7A7F8C]">
                You don&apos;t have any jobs on this date yet.
              </p>
              <button
                type="button"
                onClick={onAddJob}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#8F6EE6] to-[#7A42E8] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_32px_-18px_rgba(122,66,232,0.8)] transition-transform hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4" />
                Add a Job
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HomeCalendarSection;
