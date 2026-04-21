
import React from 'react';
import { Job } from '@/types';
import ForecastSummary from './ForecastSummary';
import {
  formatYAxisTick,
  generateNiceYAxisTicks,
  prepareMonthlyData,
  prepareWeeklyData,
} from './ChartDataPreparation';

interface ForecastChartContainerProps {
  jobs: Job[];
  forecastRange: string;
  isEmpty: boolean;
  totalForecast: number;
  confirmedCount: number;
}

const ForecastChartContainer: React.FC<ForecastChartContainerProps> = ({ 
  jobs, 
  forecastRange, 
  isEmpty, 
  totalForecast,
  confirmedCount
}) => {
  // If there's no data or explicitly marked as empty, don't render the chart
  if (isEmpty || !jobs.length) {
    return null;
  }

  const chartData =
    forecastRange === 'this_month'
      ? prepareWeeklyData(jobs)
      : prepareMonthlyData(jobs);

  const maxValue = Math.max(...chartData.map((item) => item.value), 1);
  const yAxisTicks = generateNiceYAxisTicks(maxValue);
  const chartCeiling = yAxisTicks[yAxisTicks.length - 1] || 1;

  return (
    <div className="space-y-3">
      <div className="flex h-[220px] w-full gap-3 rounded-[18px] bg-[#FCFBFF] px-2 py-3">
        <div className="flex w-12 flex-col justify-between pb-7 pt-1 text-[11px] font-medium text-[#666666]">
          {yAxisTicks
            .slice()
            .reverse()
            .map((tick) => (
              <span key={tick} className="leading-none">
                {formatYAxisTick(tick)}
              </span>
            ))}
        </div>

        <div className="relative flex-1">
          <div className="absolute inset-0 flex flex-col justify-between">
            {yAxisTicks
              .slice()
              .reverse()
              .map((tick) => (
                <div
                  key={tick}
                  className="border-t border-dashed border-[rgba(155,135,245,0.18)]"
                />
              ))}
          </div>

          <div className="relative z-10 flex h-full items-end justify-between gap-3 px-1 pb-7">
            {chartData.map((entry) => {
              const heightPercent = chartCeiling
                ? Math.max((entry.value / chartCeiling) * 100, entry.value > 0 ? 8 : 0)
                : 0;

              return (
                <div
                  key={`${entry.dateStart}-${entry.name}`}
                  className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
                >
                  <div className="flex h-[150px] w-full items-end justify-center">
                    <div
                      className="w-full max-w-[26px] rounded-full transition-all"
                      style={{
                        height: `${heightPercent}%`,
                        backgroundColor: entry.isCurrentPeriod ? '#9B87F5' : '#EAE6FA',
                        opacity: entry.isCurrentPeriod ? 1 : 0.92,
                      }}
                      title={`${entry.name}: ${formatYAxisTick(entry.value)}`}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-[#888888]">
                    {entry.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <ForecastSummary 
        totalForecast={totalForecast} 
        confirmedCount={confirmedCount}
      />
    </div>
  );
};

export default ForecastChartContainer;
