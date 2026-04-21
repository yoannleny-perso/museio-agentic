
import React from 'react';
import { formatCurrency } from '@/lib/utils';

interface ForecastChartTooltipProps {
  active?: boolean;
  payload?: any[];
}

const ForecastChartTooltip: React.FC<ForecastChartTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-2 border border-[#E0E0E0] shadow-md rounded-lg animate-fade-in">
        <p className="text-sm font-medium">{data.name}</p>
        <p className="text-sm text-[#6E59A5] font-semibold">
          {formatCurrency(data.value)}
        </p>
      </div>
    );
  }
  return null;
};

export default ForecastChartTooltip;
