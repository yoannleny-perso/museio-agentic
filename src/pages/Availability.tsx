import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Capacitor } from '@capacitor/core';
import {
  AlertTriangle,
  Calendar,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  Layers,
  Link2,
  Loader2,
  Plus,
  Settings2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PrimaryActionButton } from '@/components/ui/primary-action-button';
import { CopyWeekModal } from '@/components/CopyWeekModal';
import VacationPeriodModal from '@/components/availability/VacationPeriodModal';
import AvailabilitySettingsModal from '@/components/availability/AvailabilitySettingsModal';
import ConnectedCalendarsModal, {
  AvailabilityConflict,
} from '@/components/availability/ConnectedCalendarsModal';
import { useUserAvailability } from '@/hooks/useUserAvailability';
import {
  ConnectedCalendarSource,
  ExternalCalendarEvent,
  useConnectedCalendarsState,
} from '@/hooks/useConnectedCalendarsState';
import { useAppContext } from '@/context/AppContext';
import { formatTimeDisplay, generateTimeOptions } from '@/lib/utils';
import { AvailabilitySlot, DayAvailability, formatWeekLabel } from '@/lib/availability';
import { toast } from 'sonner';

interface VacationPeriod {
  id: string;
  startDate: Date;
  endDate: Date;
}

type AvailabilityTab = 'schedule' | 'layers' | 'vacations' | 'settings';
type AvailabilityLayer = 'internal' | 'jobs' | 'vacations' | 'external';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const availabilityTemplates: Array<{
  id: string;
  label: string;
  description: string;
  build: () => DayAvailability[];
}> = [
  {
    id: 'weekday-95',
    label: 'Weekday 9-5',
    description: 'Mon-Fri 9:00 to 17:00',
    build: () =>
      DAYS.map((day, index) => ({
        day,
        enabled: index < 5,
        timeSlots: [{ start: '09:00', end: '17:00' }],
      })),
  },
  {
    id: 'evening',
    label: 'Evening Set',
    description: '6:00 PM to 11:00 PM all week',
    build: () =>
      DAYS.map((day) => ({
        day,
        enabled: true,
        timeSlots: [{ start: '18:00', end: '23:00' }],
      })),
  },
  {
    id: 'weekend',
    label: 'Weekend Focus',
    description: 'Fri-Sun active for nightlife and events',
    build: () =>
      DAYS.map((day, index) => {
        if (index < 4) {
          return {
            day,
            enabled: false,
            timeSlots: [{ start: '09:00', end: '17:00' }],
          };
        }

        if (index === 4) {
          return {
            day,
            enabled: true,
            timeSlots: [{ start: '17:00', end: '24:00' }],
          };
        }

        if (index === 5) {
          return {
            day,
            enabled: true,
            timeSlots: [{ start: '12:00', end: '24:00' }],
          };
        }

        return {
          day,
          enabled: true,
          timeSlots: [{ start: '12:00', end: '21:00' }],
        };
      }),
  },
];

const sourceLabels: Record<ConnectedCalendarSource, string> = {
  google: 'Google Calendar',
  calendly: 'Calendly',
};

const getWeekDates = (weekOffset: number) => {
  const today = new Date();
  const currentDay = today.getDay();
  const mondayDate = new Date(today);
  mondayDate.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1) + weekOffset * 7);

  return Array.from({ length: 7 }, (_, index) => {
    const nextDate = new Date(mondayDate);
    nextDate.setDate(mondayDate.getDate() + index);
    return nextDate;
  });
};

const parseTimeToMinutes = (value: string) => {
  const [hours = '0', minutes = '0'] = value.split(':');
  return Number(hours) * 60 + Number(minutes);
};

const createDefaultTimeSlot = (): AvailabilitySlot => ({
  start: '09:00',
  end: '17:00',
});

const timesOverlap = (
  startA: string,
  endA: string,
  startB: string,
  endB: string
) => {
  const startMinutesA = parseTimeToMinutes(startA);
  let endMinutesA = parseTimeToMinutes(endA);
  const startMinutesB = parseTimeToMinutes(startB);
  let endMinutesB = parseTimeToMinutes(endB);

  if (endMinutesA <= startMinutesA) {
    endMinutesA += 24 * 60;
  }

  if (endMinutesB <= startMinutesB) {
    endMinutesB += 24 * 60;
  }

  return startMinutesA < endMinutesB && startMinutesB < endMinutesA;
};

const formatDayMetaDate = (date: Date) =>
  format(date, 'd MMM');

const Availability = () => {
  const { jobs } = useAppContext();
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<AvailabilityTab>('schedule');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [vacationModalOpen, setVacationModalOpen] = useState(false);
  const [connectedCalendarsOpen, setConnectedCalendarsOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [activeLayers, setActiveLayers] = useState<Set<AvailabilityLayer>>(
    new Set(['internal', 'jobs', 'vacations', 'external'])
  );
  const [connectingSource, setConnectingSource] = useState<ConnectedCalendarSource | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  const currentWeekDates = useMemo(() => getWeekDates(currentWeekOffset), [currentWeekOffset]);

  const {
    availability,
    setAvailability,
    loading,
    saving,
    copying,
    autoSaveAvailability,
    rollbackAvailability,
    copyWeekToTargets,
    settings,
    settingsSaving,
    saveSettings,
    vacationPeriods,
    vacationPeriodsLoading,
    addVacationPeriod,
    removeVacationPeriod,
  } = useUserAvailability(currentWeekDates);

  const {
    accounts,
    events,
    blockingEvents,
    resolvedConflictIds,
    connectSource,
    refreshAccount,
    disconnectAccount,
    toggleAccountSetting,
    toggleSubCalendar,
    toggleIgnoreEvent,
    resolveConflict,
  } = useConnectedCalendarsState(currentWeekDates);

  const timeOptions = useMemo(() => generateTimeOptions(), []);

  const bookedJobsThisWeek = useMemo(
    () =>
      jobs.filter((job) => {
        if (job.status === 'drafted') return false;
        const jobEndDate = job.end_date || job.date;
        return jobEndDate >= format(currentWeekDates[0], 'yyyy-MM-dd') &&
          job.date <= format(currentWeekDates[6], 'yyyy-MM-dd');
      }),
    [currentWeekDates, jobs]
  );

  const vacationDayIds = useMemo(
    () =>
      new Set(
        currentWeekDates
          .filter((weekDate) =>
            vacationPeriods.some(
              (period) =>
                format(period.startDate, 'yyyy-MM-dd') <= format(weekDate, 'yyyy-MM-dd') &&
                format(period.endDate, 'yyyy-MM-dd') >= format(weekDate, 'yyyy-MM-dd')
            )
          )
          .map((weekDate) => format(weekDate, 'yyyy-MM-dd'))
      ),
    [currentWeekDates, vacationPeriods]
  );

  const daySummaries = useMemo(
    () =>
      currentWeekDates.map((date, index) => {
        const dateString = format(date, 'yyyy-MM-dd');
        const jobsForDay = bookedJobsThisWeek.filter((job) => {
          const jobEndDate = job.end_date || job.date;
          return dateString >= job.date && dateString <= jobEndDate;
        });
        const vacationForDay = vacationPeriods.filter(
          (period) =>
            format(period.startDate, 'yyyy-MM-dd') <= dateString &&
            format(period.endDate, 'yyyy-MM-dd') >= dateString
        );
        const externalForDay = blockingEvents.filter(
          (event) => dateString >= event.startDate && dateString <= event.endDate
        );

        return {
          day: DAYS[index],
          date,
          dateString,
          jobsForDay,
          vacationForDay,
          externalForDay,
        };
      }),
    [blockingEvents, bookedJobsThisWeek, currentWeekDates, vacationPeriods]
  );

  const previewStates = useMemo(
    () =>
      daySummaries.map((summary, index) => {
        const dayAvailability = availability[index];
        const jobsActive = activeLayers.has('jobs') && summary.jobsForDay.length > 0;
        const vacationActive = activeLayers.has('vacations') && summary.vacationForDay.length > 0;
        const externalActive =
          activeLayers.has('external') && summary.externalForDay.length > 0;

        if (!dayAvailability?.enabled || vacationActive) {
          return { ...summary, state: 'off' as const };
        }

        if (jobsActive || externalActive) {
          return { ...summary, state: 'partial' as const };
        }

        return { ...summary, state: 'open' as const };
      }),
    [activeLayers, availability, daySummaries]
  );

  const conflicts = useMemo<AvailabilityConflict[]>(() => {
    return bookedJobsThisWeek.flatMap((job) =>
      blockingEvents
        .filter((event) => {
          const eventDate = event.startDate;
          const jobEndDate = job.end_date || job.date;
          const overlapsDate = eventDate >= job.date && eventDate <= jobEndDate;

          if (!overlapsDate) {
            return false;
          }

          if (job.end_date && job.end_date !== job.date && eventDate !== job.date) {
            return true;
          }

          return timesOverlap(job.start_time, job.end_time, event.startTime, event.endTime);
        })
        .map((event) => {
          const conflictId = `${job.id}:${event.id}`;
          return {
            id: conflictId,
            date: event.startDate,
            job,
            event,
            resolved: resolvedConflictIds.includes(conflictId),
          };
        })
    );
  }, [blockingEvents, bookedJobsThisWeek, resolvedConflictIds]);

  const activeBlockingEvents = blockingEvents.filter((event) => !event.ignored);
  const blockedDayCount = previewStates.filter((state) => state.state !== 'open').length;
  const connectedSourceCount = accounts.length;
  const connectedSourceLayers = useMemo(
    () =>
      accounts.map((account) => ({
        id: `${account.source}-${account.id}`,
        label: sourceLabels[account.source],
        description:
          account.source === 'google'
            ? 'External calendar events'
            : 'Calendly bookings',
        colorClass:
          account.source === 'google'
            ? 'bg-[#ff3b30]'
            : 'bg-[#6366f1]',
      })),
    [accounts]
  );

  const applyAvailabilityChange = useCallback(
    (nextAvailability: DayAvailability[]) => {
      setAvailability(nextAvailability);

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        const result = await autoSaveAvailability(nextAvailability);

        if (result.success) {
          setSaveStatus('success');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } else {
          setSaveStatus('error');
          toast.error(result.error || 'Failed to save availability');
          rollbackAvailability();
          setTimeout(() => setSaveStatus('idle'), 3000);
        }
      }, 450);
    },
    [autoSaveAvailability, rollbackAvailability, setAvailability]
  );

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const normalizeSlotAfterChange = useCallback(
    (slot: AvailabilitySlot, field: 'start' | 'end', value: string): AvailabilitySlot => {
      const nextSlot = { ...slot, [field]: value };
      const startMinutes = parseTimeToMinutes(nextSlot.start);
      const endMinutes = parseTimeToMinutes(nextSlot.end);

      if (endMinutes > startMinutes) {
        return nextSlot;
      }

      const valueIndex = timeOptions.indexOf(value);

      if (field === 'start') {
        const nextEndValue = timeOptions[Math.min(valueIndex + 1, timeOptions.length - 1)] || '24:00';
        return {
          ...nextSlot,
          end: parseTimeToMinutes(nextEndValue) > parseTimeToMinutes(value)
            ? nextEndValue
            : '24:00',
        };
      }

      const previousStartValue = timeOptions[Math.max(valueIndex - 1, 0)] || '00:00';
      return {
        ...nextSlot,
        start: parseTimeToMinutes(previousStartValue) < parseTimeToMinutes(value)
          ? previousStartValue
          : '00:00',
      };
    },
    [timeOptions]
  );

  const handleToggleDay = (dayIndex: number) => {
    const nextAvailability = availability.map((day, index) =>
      index === dayIndex
        ? {
            ...day,
            enabled: !day.enabled,
            timeSlots: day.timeSlots.length > 0 ? day.timeSlots : [createDefaultTimeSlot()],
          }
        : day
    );
    applyAvailabilityChange(nextAvailability);
  };

  const handleTimeChange = (
    dayIndex: number,
    slotIndex: number,
    field: 'start' | 'end',
    value: string
  ) => {
    const nextAvailability = availability.map((day, index) =>
      index === dayIndex
        ? {
            ...day,
            timeSlots: day.timeSlots.map((slot, currentSlotIndex) =>
              currentSlotIndex === slotIndex
                ? normalizeSlotAfterChange(slot, field, value)
                : slot
            ),
          }
        : day
    );
    applyAvailabilityChange(nextAvailability);
  };

  const handleAddTimeSlot = (dayIndex: number) => {
    const nextAvailability = availability.map((day, index) => {
      if (index !== dayIndex) return day;

      const lastSlot = day.timeSlots[day.timeSlots.length - 1];
      const nextSlot = lastSlot
        ? {
            start: lastSlot.end === '24:00' ? '23:00' : lastSlot.end,
            end:
              lastSlot.end === '24:00'
                ? '24:00'
                : timeOptions[Math.min(timeOptions.indexOf(lastSlot.end) + 2, timeOptions.length - 1)] || '17:00',
          }
        : createDefaultTimeSlot();

      return {
        ...day,
        enabled: true,
        timeSlots: [...day.timeSlots, normalizeSlotAfterChange(nextSlot, 'end', nextSlot.end)],
      };
    });

    applyAvailabilityChange(nextAvailability);
  };

  const handleRemoveTimeSlot = (dayIndex: number, slotIndex: number) => {
    const nextAvailability = availability.map((day, index) => {
      if (index !== dayIndex) return day;

      const remainingSlots = day.timeSlots.filter((_, currentSlotIndex) => currentSlotIndex !== slotIndex);

      return {
        ...day,
        enabled: remainingSlots.length > 0 ? day.enabled : false,
        timeSlots: remainingSlots.length > 0 ? remainingSlots : [createDefaultTimeSlot()],
      };
    });

    applyAvailabilityChange(nextAvailability);
  };

  const handleApplyTemplate = (templateId: string) => {
    const selectedTemplate = availabilityTemplates.find((template) => template.id === templateId);
    if (!selectedTemplate) return;

    applyAvailabilityChange(selectedTemplate.build());
    toast.success(`${selectedTemplate.label} applied`);
  };

  const handleClearWeek = () => {
    const clearedAvailability = availability.map((day) => ({
      ...day,
      enabled: false,
      timeSlots: day.timeSlots.length > 0 ? day.timeSlots : [createDefaultTimeSlot()],
    }));
    applyAvailabilityChange(clearedAvailability);
    toast.success('This week was cleared');
  };

  const handleToggleLayer = (layer: AvailabilityLayer) => {
    setActiveLayers((currentLayers) => {
      const nextLayers = new Set(currentLayers);

      if (nextLayers.has(layer)) {
        nextLayers.delete(layer);
      } else {
        nextLayers.add(layer);
      }

      return nextLayers;
    });
  };

  const handleConnectSource = async (source: ConnectedCalendarSource) => {
    void source;
    toast.message('External calendar sync will be available once the live integration is connected.');
  };

  const handleResolveConflict = (
    conflictId: string,
    strategy: 'keep-museio' | 'ignore-external' | 'split-slots'
  ) => {
    const targetConflict = conflicts.find((conflict) => conflict.id === conflictId);
    if (!targetConflict) return;

    if (strategy === 'ignore-external' && !targetConflict.event.ignored) {
      toggleIgnoreEvent(targetConflict.event.id);
    }

    resolveConflict(conflictId);

    const successMessage =
      strategy === 'keep-museio'
        ? 'Conflict marked as resolved in favor of Museio'
        : strategy === 'ignore-external'
          ? 'External event ignored for preview purposes'
          : 'Conflict marked as split for planning';

    toast.success(successMessage);
  };

  const handleSaveAvailabilitySettings = async (nextSettings: {
    buffer_time_minutes: number;
    min_notice_hours: number;
    enable_breaks: boolean;
    break_duration_minutes: number;
  }) => {
    const success = await saveSettings(nextSettings);
    if (success) {
      setSettingsOpen(false);
    }
  };

  const goToPreviousWeek = () => {
    setCurrentWeekOffset((currentOffset) => currentOffset - 1);
  };

  const goToNextWeek = () => {
    setCurrentWeekOffset((currentOffset) => currentOffset + 1);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#8b5cf6] border-t-transparent" />
          <p className="text-sm text-slate-500">Loading availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${Capacitor.isNativePlatform() ? 'pt-20' : ''} min-h-full pb-24`}>
      <div className="app-page-shell-wide space-y-5">
        {connectedSourceCount > 0 && activeBlockingEvents.length > 0 ? (
          <div className="rounded-[26px] border border-amber-200 bg-amber-50/80 p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">External calendars are actively protecting your booking page</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {activeBlockingEvents.length} external block{activeBlockingEvents.length === 1 ? '' : 's'} are affecting this week’s public slot visibility.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-[#ffd999] bg-white text-amber-700 hover:bg-[#fffaf1]"
                onClick={() => setConnectedCalendarsOpen(true)}
              >
                Manage Calendars
              </Button>
            </div>
          </div>
        ) : null}

        <div className="rounded-[30px] border border-[rgba(122,83,255,0.08)] bg-white/90 p-5 shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.05)] backdrop-blur-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Current range</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Availability editor</h2>
              <p className="mt-2 max-w-xl text-sm text-slate-500">
                Move week by week, then use the sections below to shape your public booking window.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-[24px] border border-[#ece3fb] bg-[#fbfaff] px-3 py-3 shadow-sm xl:min-w-[360px]">
              <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Week of</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatWeekLabel(currentWeekDates[0])}
                </p>
              </div>
              <Button type="button" variant="ghost" size="icon" className="rounded-full" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] bg-transparent p-2">
          <div className="flex justify-between gap-2 bg-transparent p-0">
          {([
            {
              id: 'schedule',
              label: 'Schedule',
              icon: Clock3,
            },
            {
              id: 'layers',
              label: 'Layers',
              icon: Layers,
            },
            {
              id: 'vacations',
              label: 'Vacations',
              icon: CalendarRange,
            },
            {
              id: 'settings',
              label: 'Settings',
              icon: Settings2,
            },
          ] as const).map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={activeTab === tab.id}
                className={`flex flex-1 flex-col items-center gap-1 rounded-[22px] px-2 py-3 text-xs font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gray-50/90 text-museio-purple shadow-lg scale-[1.02]'
                    : 'text-slate-500 hover:bg-gray-50 hover:text-slate-900 hover:shadow-md'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
          </div>
        </div>

        {activeTab === 'schedule' ? (
          <div className="space-y-4">
            <div className="rounded-[30px] border border-slate-200 bg-white/95 p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Weekly schedule</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Working hours for this week</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Adjust your weekly availability, then let jobs, vacations, and connected calendars trim what stays publicly bookable.
                  </p>
                </div>
                <CopyWeekModal onCopy={copyWeekToTargets} copying={copying} />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {availabilityTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleApplyTemplate(template.id)}
                    className="rounded-[24px] border border-slate-200 bg-[#fbfaff] p-4 text-left transition hover:border-[#dcc7ff] hover:bg-white"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#8b5cf6]" />
                      <p className="text-sm font-semibold text-slate-900">{template.label}</p>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{template.description}</p>
                  </button>
                ))}
              </div>

              <div className="mt-5 space-y-3">
                {availability.map((day, index) => {
                  const summary = daySummaries[index];
                  const hasBlocks =
                    summary.jobsForDay.length > 0 ||
                    summary.vacationForDay.length > 0 ||
                    summary.externalForDay.length > 0;

                  return (
                    <div
                      key={day.day}
                      className={`rounded-[28px] border p-4 transition ${
                        day.enabled
                          ? 'border-slate-200 bg-white'
                          : 'border-slate-200 bg-slate-50/80'
                      }`}
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={day.enabled}
                              onCheckedChange={() => handleToggleDay(index)}
                            />
                            <div>
                              <p className={`text-[1.9rem] leading-none font-semibold tracking-tight ${day.enabled ? 'text-slate-900' : 'text-slate-400'}`}>
                                {day.day}
                              </p>
                              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                {formatDayMetaDate(summary.date)}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap justify-end gap-1.5">
                            {summary.jobsForDay.length > 0 ? (
                              <span className="rounded-full bg-[#eef6ff] px-2.5 py-1 text-[11px] font-medium text-[#3556c8]">
                                {summary.jobsForDay.length} job{summary.jobsForDay.length === 1 ? '' : 's'}
                              </span>
                            ) : null}
                            {summary.externalForDay.length > 0 ? (
                              <span className="rounded-full bg-[#f6ecff] px-2.5 py-1 text-[11px] font-medium text-[#7c3aed]">
                                {summary.externalForDay.length} calendar block{summary.externalForDay.length === 1 ? '' : 's'}
                              </span>
                            ) : null}
                            {summary.vacationForDay.length > 0 ? (
                              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                                Vacation / block
                              </span>
                            ) : null}
                            {day.enabled && !hasBlocks ? (
                              <span className="rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-medium text-green-700">
                                Fully open
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {day.enabled ? (
                          <div className="space-y-2.5">
                            {day.timeSlots.map((slot, slotIndex) => (
                              <div
                                key={`${day.day}-${slotIndex}`}
                                className="grid grid-cols-[minmax(0,1fr)_28px_minmax(0,1fr)_36px] items-center gap-2 rounded-[22px] border border-slate-200 bg-[#fcfbff] p-2.5"
                              >
                                <Select
                                  value={slot.start}
                                  onValueChange={(value) =>
                                    handleTimeChange(index, slotIndex, 'start', value)
                                  }
                                >
                                  <SelectTrigger className="h-12 w-full rounded-[16px] border-slate-200 bg-white px-3 text-left text-[15px] font-semibold">
                                    <SelectValue>
                                      {formatTimeDisplay(slot.start)}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {timeOptions.map((time) => (
                                      <SelectItem key={time} value={time}>
                                        {formatTimeDisplay(time)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                <span className="text-center text-base font-semibold text-slate-400">to</span>

                                <Select
                                  value={slot.end}
                                  onValueChange={(value) =>
                                    handleTimeChange(index, slotIndex, 'end', value)
                                  }
                                >
                                  <SelectTrigger className="h-12 w-full rounded-[16px] border-slate-200 bg-white px-3 text-left text-[15px] font-semibold">
                                    <SelectValue>
                                      {formatTimeDisplay(slot.end)}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {timeOptions.map((time) => (
                                      <SelectItem key={time} value={time}>
                                        {formatTimeDisplay(time)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                {day.timeSlots.length > 1 ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500"
                                    onClick={() => handleRemoveTimeSlot(index, slotIndex)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <span />
                                )}
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => handleAddTimeSlot(index)}
                              className="inline-flex items-center gap-2 text-sm font-semibold text-[#7c3aed] transition hover:text-[#6d28d9]"
                            >
                              <Plus className="h-4 w-4" />
                              Add time slot
                            </button>
                          </div>
                        ) : (
                          <div className="rounded-[20px] border border-dashed border-slate-200 bg-white/70 px-4 py-3 text-sm font-medium text-slate-400">
                            Turn this day on to expose one or more available time ranges.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-white/95 p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Schedule tools</p>
                  <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Batch actions for this week</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={handleClearWeek}
                  >
                    Clear This Week
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setVacationModalOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add Block
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex min-h-10 items-center justify-center gap-2 rounded-[22px] bg-[#faf7ff] px-4 py-3">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                    <span className="text-sm text-slate-500">Saving changes...</span>
                  </>
                ) : saveStatus === 'success' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-600">Changes saved automatically</span>
                  </>
                ) : saveStatus === 'error' ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-600">Save failed and changes were reverted</span>
                  </>
                ) : (
                  <span className="text-sm text-slate-500">
                    Changes save automatically while you work.
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'layers' ? (
          <div className="space-y-4">
            <div className="rounded-[30px] border border-slate-200 bg-white/95 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-slate-900">Availability Layers</h2>
                  <p className="mt-1 max-w-md text-sm leading-5 text-slate-500">
                    Control which calendars and event types affect your public booking availability
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-2xl font-semibold tracking-tight text-slate-700">
                    {3 + connectedSourceLayers.length}
                  </p>
                  <p className="text-sm text-slate-500">active</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {([
                  {
                    id: 'internal' as const,
                    label: 'My schedule',
                    description: 'Weekly working hours',
                    colorClass: 'bg-[#8b5cf6]',
                    disabled: false,
                  },
                  {
                    id: 'jobs' as const,
                    label: 'Booked jobs',
                    description: 'Confirmed and upcoming gigs',
                    colorClass: 'bg-[#3b82f6]',
                    disabled: false,
                  },
                  {
                    id: 'vacations' as const,
                    label: 'Vacations',
                    description: 'Blocked vacation periods',
                    colorClass: 'bg-[#f59e0b]',
                    disabled: false,
                  },
                  ...connectedSourceLayers.map((sourceLayer) => ({
                    id: 'external' as const,
                    label: sourceLayer.label,
                    description: sourceLayer.description,
                    colorClass: sourceLayer.colorClass,
                    disabled: false,
                    key: sourceLayer.id,
                  })),
                  ...(connectedSourceLayers.length === 0
                    ? [
                        {
                          id: 'external' as const,
                          label: 'External calendars',
                          description: 'Connect a calendar to activate this layer',
                          colorClass: 'bg-[#cbd5e1]',
                          disabled: true,
                          key: 'external-empty',
                        },
                      ]
                    : []),
                ]).map((layer) => {
                  const isActive = activeLayers.has(layer.id);

                  return (
                    <button
                      key={'key' in layer ? layer.key : layer.id}
                      type="button"
                      onClick={() => !layer.disabled && handleToggleLayer(layer.id)}
                      disabled={layer.disabled}
                      className={`flex w-full items-center justify-between gap-3 rounded-[22px] border px-4 py-4 text-left transition ${
                        layer.disabled
                          ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
                          : 'border-slate-200 bg-white hover:border-[#d9c2ff] hover:bg-[#fcf9ff]'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`h-8 w-2 shrink-0 rounded-full ${layer.colorClass}`} />
                        <div className="min-w-0">
                          <p className="text-base font-semibold text-slate-900">{layer.label}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{layer.description}</p>
                        </div>
                      </div>
                      <div
                        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                          isActive ? 'bg-[#8b5cf6]' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                            isActive ? 'left-6' : 'left-1'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full border-[#d8c4ff] text-[#7c3aed] hover:bg-[#f7f1ff]"
                  onClick={() => setConnectedCalendarsOpen(true)}
                >
                  <Link2 className="h-4 w-4" />
                  Manage Calendars
                </Button>
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-white/95 p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Active external blocks</p>
                  <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Upcoming synced events</h3>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-[#7c3aed] hover:bg-[#f7f1ff] hover:text-[#6d28d9]"
                  onClick={() => setConnectedCalendarsOpen(true)}
                >
                  Review All
                </Button>
              </div>

              {events.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {events.slice(0, 4).map((event) => (
                    <div key={event.id} className="flex items-center justify-between gap-4 rounded-[24px] border border-slate-200 bg-[#fbfaff] p-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">{event.maskedTitle || event.title}</p>
                          <span className="rounded-full bg-[#ede4ff] px-2.5 py-1 text-[11px] font-semibold text-[#7c3aed]">
                            {sourceLabels[event.source]}
                          </span>
                          {event.status === 'tentative' ? (
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                              Tentative
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {event.startDate} · {event.startTime} - {event.endTime}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => toggleIgnoreEvent(event.id)}
                      >
                        {event.ignored ? 'Unignore' : 'Ignore'}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-[26px] border border-dashed border-slate-300 bg-slate-50/90 p-6 text-center">
                  <Link2 className="mx-auto h-9 w-9 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-900">No external events yet</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Connect Google Calendar or Calendly to preview protected slots here.
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setConnectedCalendarsOpen(true)}
              className="flex w-full items-center gap-4 rounded-[30px] border border-slate-200 bg-white/95 p-5 text-left shadow-sm transition hover:border-[#d9c2ff] hover:bg-[#fcf9ff]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-[#f4effd]">
                <Link2 className="h-6 w-6 text-[#7c3aed]" />
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold text-slate-900">Connected Calendars</p>
                <p className="mt-1 text-sm text-slate-500">
                  {connectedSourceCount > 0
                    ? 'Manage account settings, privacy masking, and conflict handling.'
                    : 'Open the sync manager to connect Google Calendar or Calendly.'}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </button>
          </div>
        ) : null}

        {activeTab === 'vacations' ? (
          <div className="rounded-[30px] border border-slate-200 bg-white/95 p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Manual blocks</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Vacations & blackout periods</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Temporarily pause public booking windows for time off, tours, travel, or recovery.
                </p>
              </div>
              <PrimaryActionButton
                type="button"
                size="sm"
                className="rounded-full"
                onClick={() => setVacationModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Block
              </PrimaryActionButton>
            </div>

            {vacationPeriodsLoading ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : vacationPeriods.length > 0 ? (
              <div className="mt-5 space-y-3">
                {vacationPeriods.map((period: VacationPeriod) => (
                  <div key={period.id} className="flex items-center justify-between gap-4 rounded-[24px] border border-amber-200 bg-amber-50/80 p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90">
                        <Calendar className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {format(period.startDate, 'd MMM')} - {format(period.endDate, 'd MMM yyyy')}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          This range will be blocked from public availability.
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-[#d8576b] hover:bg-[#fff1f4] hover:text-[#d8576b]"
                      onClick={() => removeVacationPeriod(period.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-slate-50/90 p-10 text-center">
                <CalendarRange className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-4 text-base font-semibold text-slate-900">No vacation periods yet</p>
                <p className="mt-2 text-sm text-slate-500">
                  Add a manual block whenever you need to pause bookings for time off or travel.
                </p>
              </div>
            )}
          </div>
        ) : null}

        {activeTab === 'settings' ? (
          <div className="rounded-[30px] border border-slate-200 bg-white/95 p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Booking settings</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Rules for public booking</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Adjust notice, booking buffer, and optional breaks for anyone booking through your public portfolio.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="mt-5 w-full rounded-[28px] border border-[#d8c4ff] bg-[#fbfaff] p-5 text-left transition hover:border-[#ccb3ff] hover:bg-white"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f4ebff] text-[#7c3aed]">
                  <Settings2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-semibold tracking-tight text-slate-900">Booking Settings</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Notice: {settings.min_notice_hours}h, buffer: {settings.buffer_time_minutes} mins, breaks: {settings.enable_breaks ? 'on' : 'off'}.
                  </p>
                </div>
              </div>
            </button>
          </div>
        ) : null}

        <div className="rounded-[30px] border border-slate-200 bg-white/95 p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Tools & insights</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Preview, sync, and booking rules</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                This utility area keeps weekly insights and secondary controls together without crowding the schedule editor above.
              </p>
            </div>
            <div className="rounded-full bg-[#faf7ff] px-4 py-2 text-sm font-medium text-slate-600">
              {formatWeekLabel(currentWeekDates[0])}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setPreviewVisible((current) => !current)}
              className={`rounded-[24px] border p-4 text-left transition ${
                previewVisible
                  ? 'border-[#d8c4ff] bg-[#faf5ff] shadow-sm'
                  : 'border-slate-200 bg-[#fbfaff] hover:border-[#dcc7ff] hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                {previewVisible ? <EyeOff className="h-4 w-4 text-[#7c3aed]" /> : <Eye className="h-4 w-4 text-[#7c3aed]" />}
                <p className="text-sm font-semibold text-slate-900">{previewVisible ? 'Hide Preview' : 'Show Preview'}</p>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Check the exact week clients can see after jobs, vacations, and external blocks are applied.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setConnectedCalendarsOpen(true)}
              className="rounded-[24px] border border-slate-200 bg-[#fbfaff] p-4 text-left transition hover:border-[#dcc7ff] hover:bg-white"
            >
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-[#7c3aed]" />
                <p className="text-sm font-semibold text-slate-900">Connected Calendars</p>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {connectedSourceCount > 0
                  ? `${connectedSourceCount} source${connectedSourceCount === 1 ? '' : 's'} connected and protecting your public slots.`
                  : 'Connect Google Calendar or Calendly to add external availability layers.'}
              </p>
            </button>
          </div>

          {previewVisible ? (
            <div className="mt-5 rounded-[30px] border-2 border-[#d7c3ff] bg-[#fcfaff] p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Eye className="h-4 w-4 text-[#7c3aed]" />
                <p className="text-sm font-semibold text-slate-900">Public Booking Preview</p>
                <span className="text-xs text-slate-500">What clients effectively see this week</span>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {previewStates.map((dayState, index) => {
                  const stateClasses =
                    dayState.state === 'open'
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : dayState.state === 'partial'
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : 'border-slate-200 bg-slate-100 text-slate-400';

                  return (
                    <div key={dayState.dateString} className="text-center">
                      <p className="text-xs font-medium text-slate-500">{DAYS[index].slice(0, 3)}</p>
                      <div className={`mt-2 rounded-2xl border p-3 ${stateClasses}`}>
                        <p className="text-sm font-semibold">{format(dayState.date, 'd')}</p>
                        <p className="mt-1 text-[11px] font-medium">
                          {dayState.state === 'open'
                            ? 'Open'
                            : dayState.state === 'partial'
                              ? 'Partial'
                              : 'Unavailable'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-center text-xs text-slate-500">
                Green = open, amber = partially blocked by jobs or calendars, gray = unavailable or fully blocked.
              </p>
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {([
              {
                label: 'Active days',
                value: availability.filter((day) => day.enabled).length,
                description: 'Days currently open for public booking.',
                className: 'bg-[#faf7ff]',
              },
              {
                label: 'Blocked this week',
                value: blockedDayCount,
                description: 'Days reduced by jobs, vacations, or sync layers.',
                className: 'bg-[#fff7e8]',
              },
              {
                label: 'Booked jobs',
                value: bookedJobsThisWeek.length,
                description: 'Jobs already sitting inside this weekly view.',
                className: 'bg-[#eef6ff]',
              },
              {
                label: 'Connected sources',
                value: connectedSourceCount,
                description: 'External calendars feeding availability rules.',
                className: 'bg-[#f4effd]',
              },
            ]).map((card) => (
              <div key={card.label} className={`rounded-[24px] border border-slate-200 p-4 ${card.className}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{card.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{card.value}</p>
                <p className="mt-2 text-sm text-slate-500">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <VacationPeriodModal
        open={vacationModalOpen}
        onOpenChange={setVacationModalOpen}
        onAddVacation={addVacationPeriod}
      />

      <AvailabilitySettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        settingsSaving={settingsSaving}
        onSave={handleSaveAvailabilitySettings}
      />

      <ConnectedCalendarsModal
        open={connectedCalendarsOpen}
        onOpenChange={setConnectedCalendarsOpen}
        accounts={accounts}
        events={events}
        conflicts={conflicts}
        connectingSource={connectingSource}
        onConnectSource={handleConnectSource}
        onRefreshAccount={refreshAccount}
        onDisconnectAccount={disconnectAccount}
        onToggleAccountSetting={toggleAccountSetting}
        onToggleSubCalendar={toggleSubCalendar}
        onToggleIgnoreEvent={toggleIgnoreEvent}
        onResolveConflict={handleResolveConflict}
      />
    </div>
  );
};

export default Availability;
