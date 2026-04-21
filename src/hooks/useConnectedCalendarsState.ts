import { useCallback, useMemo } from 'react';

export type ConnectedCalendarSource = 'google' | 'calendly';
export type ConnectedCalendarSyncStatus = 'active' | 'refreshing' | 'stale';

export interface ConnectedSubCalendar {
  id: string;
  name: string;
  color: string;
  enabled: boolean;
  isBlocking: boolean;
}

export interface ConnectedCalendarAccount {
  id: string;
  source: ConnectedCalendarSource;
  accountEmail: string;
  syncStatus: ConnectedCalendarSyncStatus;
  lastSyncDate: string;
  isBlocking: boolean;
  includeTentative: boolean;
  privacyMaskEnabled: boolean;
  calendars: ConnectedSubCalendar[];
}

export interface ExternalCalendarEvent {
  id: string;
  accountId: string;
  source: ConnectedCalendarSource;
  title: string;
  maskedTitle?: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'tentative';
  calendarId: string;
  calendarName: string;
  ignored: boolean;
}

export const useConnectedCalendarsState = (_weekDates: Date[]) => {
  const accounts = useMemo(() => [] as ConnectedCalendarAccount[], []);
  const events = useMemo(() => [] as ExternalCalendarEvent[], []);
  const blockingEvents = useMemo(() => [] as ExternalCalendarEvent[], []);
  const ignoredEventIds = useMemo(() => [] as string[], []);
  const resolvedConflictIds = useMemo(() => [] as string[], []);

  const connectSource = useCallback((_source: ConnectedCalendarSource) => false, []);
  const refreshAccount = useCallback((_accountId: string) => {}, []);
  const disconnectAccount = useCallback((_accountId: string) => {}, []);
  const toggleAccountSetting = useCallback(
    (
      _accountId: string,
      _setting: 'isBlocking' | 'includeTentative' | 'privacyMaskEnabled'
    ) => {},
    []
  );
  const toggleSubCalendar = useCallback((_accountId: string, _calendarId: string) => {}, []);
  const toggleIgnoreEvent = useCallback((_eventId: string) => {}, []);
  const resolveConflict = useCallback((_conflictId: string) => {}, []);

  return {
    accounts,
    events,
    blockingEvents,
    ignoredEventIds,
    resolvedConflictIds,
    connectSource,
    refreshAccount,
    disconnectAccount,
    toggleAccountSetting,
    toggleSubCalendar,
    toggleIgnoreEvent,
    resolveConflict,
  };
};
