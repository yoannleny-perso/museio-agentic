import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Link2,
  Lock,
  RefreshCw,
  Shield,
  Unlink2,
  X,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PrimaryActionButton } from '@/components/ui/primary-action-button';
import { cn, formatTimeWithoutSeconds } from '@/lib/utils';
import { Job } from '@/types';
import { getJobDisplayPrice } from '@/utils/jobPricing';
import {
  ConnectedCalendarAccount,
  ConnectedCalendarSource,
  ExternalCalendarEvent,
} from '@/hooks/useConnectedCalendarsState';

export interface AvailabilityConflict {
  id: string;
  date: string;
  job: Job;
  event: ExternalCalendarEvent;
  resolved: boolean;
}

interface ConnectedCalendarsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: ConnectedCalendarAccount[];
  events: ExternalCalendarEvent[];
  conflicts: AvailabilityConflict[];
  connectingSource: ConnectedCalendarSource | null;
  onConnectSource: (source: ConnectedCalendarSource) => void;
  onRefreshAccount: (accountId: string) => void;
  onDisconnectAccount: (accountId: string) => void;
  onToggleAccountSetting: (
    accountId: string,
    setting: 'isBlocking' | 'includeTentative' | 'privacyMaskEnabled'
  ) => void;
  onToggleSubCalendar: (accountId: string, calendarId: string) => void;
  onToggleIgnoreEvent: (eventId: string) => void;
  onResolveConflict: (
    conflictId: string,
    strategy: 'keep-museio' | 'ignore-external' | 'split-slots'
  ) => void;
}

const sourceMeta: Record<
  ConnectedCalendarSource,
  { label: string; pillClass: string; accentClass: string; iconBgClass: string }
> = {
  google: {
    label: 'Google Calendar',
    pillClass: 'bg-red-100 text-red-700',
    accentClass: 'text-red-600',
    iconBgClass: 'bg-red-50',
  },
  calendly: {
    label: 'Calendly',
    pillClass: 'bg-indigo-100 text-indigo-700',
    accentClass: 'text-indigo-600',
    iconBgClass: 'bg-indigo-50',
  },
};

const syncStatusMeta = {
  active: {
    label: 'Active',
    className: 'bg-green-100 text-green-700',
  },
  refreshing: {
    label: 'Syncing',
    className: 'bg-blue-100 text-blue-700',
  },
  stale: {
    label: 'Needs Refresh',
    className: 'bg-amber-100 text-amber-700',
  },
} as const;

const formatLastSync = (value: string) => {
  const minutesAgo = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (minutesAgo < 1) return 'Just now';
  if (minutesAgo === 1) return '1 min ago';
  if (minutesAgo < 60) return `${minutesAgo} mins ago`;
  const hoursAgo = Math.round(minutesAgo / 60);
  return `${hoursAgo}h ago`;
};

const ToggleRow = ({
  label,
  description,
  checked,
  onToggle,
}: {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    onClick={onToggle}
    className="flex w-full items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-[#fbfaff] px-4 py-3 text-left transition hover:border-[#dcc7ff] hover:bg-white"
  >
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
    </div>
    <div
      className={cn(
        'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition',
        checked ? 'bg-[#8b5cf6]' : 'bg-slate-300'
      )}
    >
      <div
        className={cn(
          'absolute top-1 h-4 w-4 rounded-full bg-white transition',
          checked ? 'left-6' : 'left-1'
        )}
      />
    </div>
  </button>
);

const ConnectedCalendarsModal = ({
  open,
  onOpenChange,
  accounts,
  events,
  conflicts,
  connectingSource,
  onConnectSource,
  onRefreshAccount,
  onDisconnectAccount,
  onToggleAccountSetting,
  onToggleSubCalendar,
  onToggleIgnoreEvent,
  onResolveConflict,
}: ConnectedCalendarsModalProps) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'events' | 'conflicts'>('accounts');
  const [showConnectOptions, setShowConnectOptions] = useState(false);
  const [showPermissionsInfo, setShowPermissionsInfo] = useState(false);

  const unresolvedConflictCount = useMemo(
    () => conflicts.filter((conflict) => !conflict.resolved).length,
    [conflicts]
  );

  const availableSources = (['google', 'calendly'] as ConnectedCalendarSource[]).filter(
    (source) => !accounts.some((account) => account.source === source)
  );

  const handleClose = () => {
    setShowConnectOptions(false);
    setShowPermissionsInfo(false);
    setActiveTab('accounts');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <DialogContent
        hideCloseButton
        className="w-[min(96vw,860px)] max-h-[90vh] rounded-[30px] border border-white/80 bg-[#fcfbff] p-0 shadow-[0_30px_80px_-35px_rgba(109,40,217,0.45)]"
        style={{ maxHeight: '90svh' }}
        aria-describedby="connected-calendars-description"
      >
        <DialogTitle className="sr-only">Connected calendars</DialogTitle>
        <DialogDescription id="connected-calendars-description" className="sr-only">
          Manage external calendar accounts, upcoming synced events, and scheduling conflicts.
        </DialogDescription>

        <div className="flex max-h-[90svh] flex-col overflow-hidden">
          <div className="border-b border-[#eadff7] bg-gradient-to-br from-[#fff7ff] via-[#faf7ff] to-[#f6efff] px-6 pb-5 pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b5cf6]">Availability sync</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Connected Calendars</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-500">
                  Protect public booking slots with external events, privacy masking, and conflict review.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d8c4ff] bg-white/90 text-[#8b5cf6] transition hover:bg-[#f7f1ff]"
                aria-label="Close connected calendars"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
                {accounts.length} connected source{accounts.length === 1 ? '' : 's'}
              </div>
              <div className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
                {events.filter((event) => !event.ignored).length} active external event{events.filter((event) => !event.ignored).length === 1 ? '' : 's'}
              </div>
              <div className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
                {unresolvedConflictCount} unresolved conflict{unresolvedConflictCount === 1 ? '' : 's'}
              </div>
              {availableSources.length > 0 ? (
                <PrimaryActionButton
                  type="button"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setShowConnectOptions((current) => !current)}
                >
                  <Link2 className="h-4 w-4" />
                  Calendar Sync Status
                </PrimaryActionButton>
              ) : null}
            </div>
          </div>

          <div className="border-b border-[#eadff7] bg-white/80 px-5 py-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {([
                ['accounts', 'Connected Accounts'],
                ['events', 'Upcoming Events'],
                ['conflicts', `Conflicts${unresolvedConflictCount > 0 ? ` (${unresolvedConflictCount})` : ''}`],
              ] as const).map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-semibold transition',
                    activeTab === tab
                      ? 'bg-[#8b5cf6] text-white shadow-sm'
                      : 'bg-[#f4effd] text-slate-600 hover:bg-[#ede4ff] hover:text-[#7c3aed]'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-5">
            {showConnectOptions ? (
              <div className="mb-5 rounded-[26px] border border-[#ead7ff] bg-[#f9f4ff] p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b5cf6]">Connect a source</p>
                    <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Choose a calendar provider</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      External calendar sync is disabled in this build until a real server-backed integration is available.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-[#8b5cf6] hover:bg-white/80 hover:text-[#7c3aed]"
                    onClick={() => setShowConnectOptions(false)}
                  >
                    Close
                  </Button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {availableSources.map((source) => (
                    <button
                      key={source}
                      type="button"
                      onClick={() => onConnectSource(source)}
                      disabled
                      className="flex items-center justify-between rounded-[24px] border border-white/80 bg-white/90 p-4 text-left shadow-sm transition hover:border-[#d9c2ff] hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', sourceMeta[source].iconBgClass)}>
                          <CalendarDays className={cn('h-6 w-6', sourceMeta[source].accentClass)} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{sourceMeta[source].label}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {source === 'google'
                              ? 'Sync busy times and optionally mask event titles.'
                              : 'Protect your availability with scheduled consults and sessions.'}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
                        Coming soon
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowPermissionsInfo((current) => !current)}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#7c3aed] hover:underline"
                >
                  <Shield className="h-4 w-4" />
                  {showPermissionsInfo ? 'Hide permissions explainer' : 'View permissions explainer'}
                </button>

                {showPermissionsInfo ? (
                  <div className="mt-4 rounded-[22px] border border-[#ddd6fe] bg-white/90 p-4">
                    <div className="space-y-3 text-sm text-slate-600">
                      {[
                        'Museio only uses event timing and status to protect booking slots.',
                        'Privacy masking hides external event titles from your public booking page.',
                        'You can disconnect a source at any time without affecting your internal availability.',
                      ].map((item) => (
                        <div key={item} className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#ede4ff] text-[#7c3aed]">
                            <Check className="h-3 w-3" />
                          </div>
                          <p>{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeTab === 'accounts' ? (
              <div className="space-y-4">
                {accounts.length === 0 ? (
                  <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50/90 p-8 text-center">
                    <Link2 className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-4 text-base font-semibold text-slate-900">No external calendars connected</p>
                    <p className="mt-2 text-sm text-slate-500">
                      External calendar sync is not yet available in production. This preview stays internal until the real provider integration is shipped.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-5 rounded-full border-[#d8c4ff] text-[#7c3aed] hover:bg-[#f7f1ff]"
                      onClick={() => setShowConnectOptions(true)}
                    >
                      <Link2 className="h-4 w-4" />
                      View Sync Status
                    </Button>
                  </div>
                ) : null}

                {accounts.map((account) => {
                  const statusInfo = syncStatusMeta[account.syncStatus];
                  const sourceInfo = sourceMeta[account.source];

                  return (
                    <div key={account.id} className="rounded-[28px] border border-slate-200 bg-white/95 p-4 shadow-sm sm:p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                          <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', sourceInfo.iconBgClass)}>
                            <CalendarDays className={cn('h-6 w-6', sourceInfo.accentClass)} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="break-words text-lg font-semibold tracking-tight text-slate-900">
                                {sourceInfo.label}
                              </h3>
                              <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold', statusInfo.className)}>
                                {statusInfo.label}
                              </span>
                            </div>
                            <p className="mt-1 break-all text-sm text-slate-500">{account.accountEmail}</p>
                            <p className="mt-1 text-xs text-slate-400">Last sync: {formatLastSync(account.lastSyncDate)}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto lg:min-w-[280px]">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-full border-[#d8c4ff] text-[#7c3aed] hover:bg-[#f7f1ff]"
                            onClick={() => onRefreshAccount(account.id)}
                          >
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-full border-[#f1d6dc] text-[#d8576b] hover:bg-[#fff1f4]"
                            onClick={() => onDisconnectAccount(account.id)}
                          >
                            <Unlink2 className="h-4 w-4" />
                            Disconnect
                          </Button>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 xl:grid-cols-3">
                        <ToggleRow
                          label="Block public booking"
                          description="External events remove overlapping public slots."
                          checked={account.isBlocking}
                          onToggle={() => onToggleAccountSetting(account.id, 'isBlocking')}
                        />
                        <ToggleRow
                          label="Include tentative events"
                          description="Use tentative holds as soft blockers in this preview."
                          checked={account.includeTentative}
                          onToggle={() => onToggleAccountSetting(account.id, 'includeTentative')}
                        />
                        <ToggleRow
                          label="Privacy masking"
                          description="Show Busy instead of external event titles."
                          checked={account.privacyMaskEnabled}
                          onToggle={() => onToggleAccountSetting(account.id, 'privacyMaskEnabled')}
                        />
                      </div>

                      <div className="mt-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Calendars in this account</p>
                        <div className="mt-3 space-y-2">
                          {account.calendars.map((calendar) => (
                            <button
                              key={calendar.id}
                              type="button"
                              onClick={() => onToggleSubCalendar(account.id, calendar.id)}
                              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-[#fbfaff] px-4 py-3 text-left transition hover:border-[#dcc7ff] hover:bg-white"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="h-4 w-4 rounded-full"
                                  style={{ backgroundColor: calendar.color }}
                                />
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">{calendar.name}</p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {calendar.isBlocking ? 'Blocking layer active' : 'Visible but non-blocking'}
                                  </p>
                                </div>
                              </div>
                              <div
                                className={cn(
                                  'relative h-6 w-11 rounded-full transition',
                                  calendar.enabled ? 'bg-[#8b5cf6]' : 'bg-slate-300'
                                )}
                              >
                                <div
                                  className={cn(
                                    'absolute top-1 h-4 w-4 rounded-full bg-white transition',
                                    calendar.enabled ? 'left-6' : 'left-1'
                                  )}
                                />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {activeTab === 'events' ? (
              <div className="space-y-3">
                {events.length === 0 ? (
                  <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50/90 p-8 text-center">
                    <Clock3 className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-4 text-base font-semibold text-slate-900">No external events found</p>
                    <p className="mt-2 text-sm text-slate-500">
                      Connect a calendar source to see upcoming synced events here.
                    </p>
                  </div>
                ) : null}

                {events.map((event) => {
                  const sourceInfo = sourceMeta[event.source];
                  return (
                    <div key={event.id} className="flex items-center justify-between gap-4 rounded-[24px] border border-slate-200 bg-white/95 p-4 shadow-sm">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', sourceInfo.iconBgClass)}>
                          <CalendarDays className={cn('h-5 w-5', sourceInfo.accentClass)} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {event.maskedTitle || event.title}
                            </p>
                            <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold', sourceInfo.pillClass)}>
                              {sourceInfo.label}
                            </span>
                            {event.status === 'tentative' ? (
                              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                                Tentative
                              </span>
                            ) : null}
                            {event.maskedTitle ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#ede4ff] px-2.5 py-1 text-[11px] font-semibold text-[#7c3aed]">
                                <Lock className="h-3 w-3" />
                                Masked
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-slate-500">
                            {event.startDate} · {event.startTime} - {event.endTime} · {event.calendarName}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => onToggleIgnoreEvent(event.id)}
                      >
                        {event.ignored ? 'Unignore' : 'Ignore'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {activeTab === 'conflicts' ? (
              <div className="space-y-4">
                {unresolvedConflictCount === 0 ? (
                  <div className="rounded-[28px] border border-dashed border-green-200 bg-green-50/70 p-8 text-center">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                    <p className="mt-4 text-base font-semibold text-slate-900">No conflicts right now</p>
                    <p className="mt-2 text-sm text-slate-500">
                      Your internal jobs and external calendar blocks are playing nicely together.
                    </p>
                  </div>
                ) : null}

                {conflicts
                  .filter((conflict) => !conflict.resolved)
                  .map((conflict) => {
                    const sourceInfo = sourceMeta[conflict.event.source];

                    return (
                      <div key={conflict.id} className="rounded-[28px] border border-amber-200 bg-white/95 p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-600">Conflict</p>
                            <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                              {conflict.date}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                              A Museio job overlaps with an external calendar event.
                            </p>
                          </div>
                          <div className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-700">
                            Overlap
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div className="rounded-[22px] border border-[#e8dcff] bg-[#f9f4ff] p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c3aed]">Museio booking</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">{conflict.job.title}</p>
                            <p className="mt-1 text-sm text-slate-500">
                              {formatTimeWithoutSeconds(conflict.job.start_time)} - {formatTimeWithoutSeconds(conflict.job.end_time)}
                            </p>
                            <p className="mt-2 text-sm font-medium text-[#7c3aed]">
                              {getJobDisplayPrice(conflict.job).toLocaleString('en-AU', {
                                style: 'currency',
                                currency: 'AUD',
                              })}
                            </p>
                          </div>

                          <div className="rounded-[22px] border border-amber-200 bg-amber-50/80 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">External event</p>
                            <div className="mt-2 flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900">
                                {conflict.event.maskedTitle || conflict.event.title}
                              </p>
                              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', sourceInfo.pillClass)}>
                                {sourceInfo.label}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">
                              {conflict.event.startTime} - {conflict.event.endTime}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                          <PrimaryActionButton
                            type="button"
                            className="rounded-2xl"
                            onClick={() => onResolveConflict(conflict.id, 'keep-museio')}
                          >
                            Keep Museio Event
                          </PrimaryActionButton>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-2xl"
                            onClick={() => onResolveConflict(conflict.id, 'ignore-external')}
                          >
                            Ignore External
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-2xl"
                            onClick={() => onResolveConflict(conflict.id, 'split-slots')}
                          >
                            Split Slots
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : null}

            <div className="mt-5 rounded-[26px] border border-blue-200 bg-blue-50/70 p-4">
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">How sync works in this prototype</h4>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    External calendar connections, event previews, and conflict actions are fully interactive for UI testing, while actual OAuth and live event sync still need backend wiring.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectedCalendarsModal;
