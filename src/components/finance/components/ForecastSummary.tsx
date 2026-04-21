
import React from 'react';
import { formatCurrency } from '@/lib/utils';

interface ForecastSummaryProps {
  totalForecast: number;
  confirmedCount: number; // Keeping prop for API consistency
}

const ForecastSummary: React.FC<ForecastSummaryProps> = ({ totalForecast }) => {
  return (
    <div className="flex flex-col pl-0 pr-2 gap-1">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Estimated</span>
        <div className="flex items-center">
          <div className="px-4 py-1 rounded-md bg-gradient-to-r from-[#F1F0FB] to-[#E6E1FF]">
            <span className="text-xl font-bold bg-gradient-to-r from-[#9B87F5] to-[#6E59A5] bg-clip-text text-transparent">
              {formatCurrency(totalForecast)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForecastSummary;
