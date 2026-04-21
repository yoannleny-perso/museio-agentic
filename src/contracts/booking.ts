import {
  getDateOnlyRangeEnd,
  isDateOnlyRangeMultiDay,
} from './dateOnly.ts';

export const BOOKING_REQUEST_STATUSES = [
  'pending',
  'quoted',
  'declined',
  'accepted',
] as const;

export type BookingRequestStatus = (typeof BOOKING_REQUEST_STATUSES)[number];

export const BOOKING_REQUEST_STATUS = {
  pending: 'pending',
  quoted: 'quoted',
  declined: 'declined',
  accepted: 'accepted',
} as const satisfies Record<string, BookingRequestStatus>;

export const BOOKING_AVAILABILITY_BLOCKING_REQUEST_STATUSES = [
  BOOKING_REQUEST_STATUS.pending,
  BOOKING_REQUEST_STATUS.quoted,
  BOOKING_REQUEST_STATUS.accepted,
] as const satisfies readonly BookingRequestStatus[];

export const BOOKING_RESPONSE_TYPES = ['quote', 'decline'] as const;
export type BookingResponseType = (typeof BOOKING_RESPONSE_TYPES)[number];

export const BOOKING_RESPONSE_TYPE = {
  quote: 'quote',
  decline: 'decline',
} as const satisfies Record<string, BookingResponseType>;

export const BOOKING_RESPONSE_PAGE_STATUSES = [
  'accepted',
  'declined',
  'already_used',
  'not_found',
  'invalid',
  'error',
] as const;

export type BookingResponsePageStatus =
  (typeof BOOKING_RESPONSE_PAGE_STATUSES)[number];

export const BOOKING_RESPONSE_PAGE_STATUS = {
  accepted: 'accepted',
  declined: 'declined',
  alreadyUsed: 'already_used',
  notFound: 'not_found',
  invalid: 'invalid',
  error: 'error',
} as const satisfies Record<string, BookingResponsePageStatus>;

export const BOOKING_RESPONSE_FUNCTION_NAME = 'send-booking-response';
export const BOOKING_NOTIFICATION_FUNCTION_NAME = 'send-booking-notification';
export const BOOKING_SUBMISSION_FUNCTION_NAME = 'submit-booking-request';

export interface BookingResponseRequestRecord {
  id: string;
  requester_name: string;
  requester_email: string;
  event_date: string;
  event_end_date?: string | null;
  location?: string | null;
  budget?: number | null;
  message?: string | null;
  portfolio_user_id?: string | null;
}

export interface SendBookingResponsePayload {
  type: BookingResponseType;
  request: BookingResponseRequestRecord;
  quote_price?: number;
  message: string;
  user_email?: string;
  return_url?: string;
}

export interface SendBookingResponseResult {
  success: boolean;
  emailResponse?: unknown;
  error?: string;
  skipped?: boolean;
  warning?: string;
}

const BOOKING_REQUEST_STATUS_SET = new Set<string>(BOOKING_REQUEST_STATUSES);
const BOOKING_RESPONSE_TYPE_SET = new Set<string>(BOOKING_RESPONSE_TYPES);
const BOOKING_RESPONSE_PAGE_STATUS_SET = new Set<string>(
  BOOKING_RESPONSE_PAGE_STATUSES
);

export const isBookingRequestStatus = (
  value: unknown
): value is BookingRequestStatus =>
  typeof value === 'string' && BOOKING_REQUEST_STATUS_SET.has(value);

export const isBookingResponseType = (
  value: unknown
): value is BookingResponseType =>
  typeof value === 'string' && BOOKING_RESPONSE_TYPE_SET.has(value);

export const isBookingResponsePageStatus = (
  value: unknown
): value is BookingResponsePageStatus =>
  typeof value === 'string' && BOOKING_RESPONSE_PAGE_STATUS_SET.has(value);

export const getBookingRequestEndDate = (
  eventDate: string,
  eventEndDate?: string | null
) => getDateOnlyRangeEnd(eventDate, eventEndDate);

export const isMultiDayBookingRequest = (
  eventDate: string,
  eventEndDate?: string | null
) => isDateOnlyRangeMultiDay(eventDate, eventEndDate);
