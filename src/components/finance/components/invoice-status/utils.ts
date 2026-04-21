
import { format } from 'date-fns';
import { DateRangeOption } from '@/hooks/useJobsFinanceData';

// Chart configuration
export const CHART_COLORS = {
  paid: '#9B70F9',     // light purple
  pending: '#D7CDEB',  // very light lavender
  overdue: '#4B00A9',  // deep violet
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const getDateRangeDisplay = (option: DateRangeOption, startDate: Date, endDate: Date) => {
  return `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
};
