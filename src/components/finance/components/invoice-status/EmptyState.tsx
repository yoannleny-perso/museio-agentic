
import React from 'react';
import { SmilePlus } from 'lucide-react';
import { DateRangeOption } from '@/hooks/useJobsFinanceData';

interface EmptyStateProps {
  dateRange: DateRangeOption;
}

const EmptyState: React.FC<EmptyStateProps> = ({ dateRange }) => {
  const getDateRangeLabel = (range: DateRangeOption) => {
    switch(range) {
      case 'this_month': return 'This Month';
      case 'last_month': return 'Last 30 Days';
      case 'last_3_months': return 'Last 90 Days';
      case 'last_6_months': return 'Last 6 Months';
      case 'year_to_date': return 'Year to Date';
      case 'all_time': return 'All Time';
      default: return 'Selected Period';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-[200px] text-center">
      <SmilePlus size={48} className="text-[#9B70F9] mb-4" />
      <p className="text-lg font-medium text-[#4D2AAE]">No earnings for {getDateRangeLabel(dateRange)}</p>
      <p className="text-sm text-gray-500 mt-1">Money is coming soon!</p>
    </div>
  );
};

export default EmptyState;
