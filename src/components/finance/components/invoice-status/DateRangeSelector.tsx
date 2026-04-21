
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangeOption } from '@/hooks/useJobsFinanceData';

interface DateRangeSelectorProps {
  dateRange: DateRangeOption;
  onDateRangeChange: (value: string) => void;
}

const dateRangeOptions: { value: DateRangeOption; label: string }[] = [
  { value: 'last_month', label: 'Last 30 Days' },
  { value: 'last_3_months', label: 'Last 90 Days' },
  { value: 'last_6_months', label: 'Last 6 Months' },
  { value: 'year_to_date', label: 'Year to Date' },
  { value: 'all_time', label: 'All Time' },
];

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  dateRange,
  onDateRangeChange,
}) => {
  return (
    <Select value={dateRange} onValueChange={onDateRangeChange}>
      <SelectTrigger className="border-[#D3D3D3] rounded-xl h-10 w-[140px] text-[15px] font-medium">
        <SelectValue placeholder="Select period" />
      </SelectTrigger>
      <SelectContent>
        {dateRangeOptions.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default DateRangeSelector;
