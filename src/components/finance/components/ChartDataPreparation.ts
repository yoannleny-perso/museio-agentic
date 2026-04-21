
import { Job } from '@/types';
import { format, parseISO, addDays, addMonths, isToday, isSameMonth, startOfDay, endOfDay } from 'date-fns';
import { getJobDisplayPrice } from '@/utils/jobPricing';

// Type for data after processing for chart
export interface ChartData {
  name: string;
  value: number;
  dateStart: string;
  isCurrentPeriod?: boolean;
}

// Function to prepare data for weekly view (7 days)
export const prepareWeeklyData = (jobs: Job[]): ChartData[] => {
  const today = startOfDay(new Date()); // Use startOfDay for consistent date comparison
  const result: ChartData[] = [];
  
  // Create an array for the next 7 days starting from today
  for (let i = 0; i < 7; i++) {
    const currentDate = addDays(today, i);
    const currentDateEnd = endOfDay(currentDate); // Consider full day
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const dayName = format(currentDate, 'EEE');
    
    // Find jobs for this date
    const dayjobs = jobs.filter(job => {
      const jobDate = parseISO(job.date);
      return format(jobDate, 'yyyy-MM-dd') === dateStr;
    });
    
    // Calculate total value for this day
    const totalValue = dayjobs.reduce((sum, job) => sum + getJobDisplayPrice(job), 0);
    
    result.push({
      name: dayName,
      value: totalValue,
      dateStart: dateStr,
      isCurrentPeriod: i === 0 // First day (today) is the current period
    });
  }
  
  return result;
};

// Function to prepare data for monthly view (7 months)
export const prepareMonthlyData = (jobs: Job[]): ChartData[] => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const result: ChartData[] = [];
  
  // Create an array for 7 months starting from current month
  for (let i = 0; i < 7; i++) {
    const currentDate = addMonths(new Date(currentYear, currentMonth, 1), i);
    const nextMonth = addMonths(currentDate, 1);
    const currentMonthEnd = endOfDay(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 0)); // End of month
    const monthStart = format(currentDate, 'yyyy-MM');
    const monthName = format(currentDate, 'MMM');
    
    // Find jobs for this month
    const monthjobs = jobs.filter(job => {
      const jobDate = parseISO(job.date);
      return format(jobDate, 'yyyy-MM') === monthStart;
    });
    
    // Calculate total value for this month
    const totalValue = monthjobs.reduce((sum, job) => sum + getJobDisplayPrice(job), 0);
    
    result.push({
      name: monthName,
      value: totalValue,
      dateStart: monthStart,
      isCurrentPeriod: i === 0 // First month is the current period
    });
  }
  
  return result;
};

// Enhanced function to generate nice tick values for Y-axis
export const generateNiceYAxisTicks = (maxValue: number): number[] => {
  // If the max value is 0, just return [0]
  if (maxValue <= 0) return [0, 0, 0, 0, 0, 0];
  
  // Determine the appropriate step size based on the max value
  let step: number;
  
  if (maxValue < 500) {
    // For smaller values (< $500): Use steps of $100
    step = 100;
  } else if (maxValue < 2500) {
    // For medium values ($500-$2,500): Use steps of $250
    step = 250;
  } else if (maxValue < 5000) {
    // For larger values ($2,500-$5,000): Use steps of $500
    step = 500;
  } else if (maxValue < 10000) {
    // For values ($5,000-$10,000): Use steps of $2,000
    step = 2000;
  } else if (maxValue < 50000) {
    // For values ($10,000-$50,000): Use steps of $10,000
    step = 10000;
  } else if (maxValue < 250000) {
    // For values ($50,000-$250,000): Use steps of $50,000
    step = 50000;
  } else if (maxValue < 1000000) {
    // For values ($250,000-$1,000,000): Use steps of $250,000
    step = 250000;
  } else {
    // For very large values (> $1,000,000): Use steps of $1,000,000
    step = 1000000;
  }
  
  // Calculate ceiling for the max value to ensure it's a multiple of the step
  // This guarantees the max value on the Y-axis is always above the highest data point
  const ceilingMax = Math.ceil(maxValue / step) * step;
  
  // If the ceiling is exactly equal to maxValue, add one more step to provide breathing room
  const adjustedMax = ceilingMax === maxValue ? ceilingMax + step : ceilingMax;
  
  // Generate an array with exactly 6 ticks from 0 to adjustedMax
  return [0, step, step * 2, step * 3, step * 4, step * 5].map(v => 
    v > adjustedMax ? adjustedMax : v
  );
};

// Improved function to format Y axis ticks with better readability
export const formatYAxisTick = (value: number): string => {
  if (value === 0) return '$0';
  
  if (value >= 1000000) {
    return `$${(value / 1000000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;
  }
  
  if (value >= 1000) {
    // For values over 1000, use K format but handle exact thousands better
    const displayValue = value % 1000 === 0 
      ? Math.round(value/1000)
      : (value / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 });
    return `$${displayValue}K`;
  }
  
  // For smaller values, just prepend $ sign
  return `$${value}`;
};
