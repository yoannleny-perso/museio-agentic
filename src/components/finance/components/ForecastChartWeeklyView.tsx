
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Job } from '@/types';
import ForecastChartTooltip from './ForecastChartTooltip';
import { prepareWeeklyData, formatYAxisTick, generateNiceYAxisTicks } from './ChartDataPreparation';

interface ForecastChartWeeklyViewProps {
  jobs: Job[];
}

const ForecastChartWeeklyView: React.FC<ForecastChartWeeklyViewProps> = ({ jobs }) => {
  // Prepare data for chart
  const chartData = prepareWeeklyData(jobs);
  
  // Find max value for better Y-axis range with some padding at the top
  const maxValue = Math.max(...chartData.map(item => item.value), 1); // Ensure at least 1 for empty charts
  
  // Generate nice tick values for Y-axis instead of just using domain
  const yAxisTicks = generateNiceYAxisTicks(maxValue);

  // Width of each bar - reduced for a finer appearance
  const barWidth = 20; // Thinner bars for a more elegant look

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 5, bottom: 16 }} // Added left margin: 5px
        barGap={10} // Adjusted for better spacing with thinner bars
      >
        <CartesianGrid 
          strokeDasharray="3 3" 
          vertical={false} 
          stroke="rgba(155, 135, 245, 0.1)" 
          strokeOpacity={0.6}
        />
        <XAxis 
          dataKey="name" 
          tickLine={false}
          axisLine={{ stroke: "#EEEEEE" }}
          tick={{ fontSize: 11, fill: "#888888" }}
          height={30} 
          tickMargin={8}
        />
        <YAxis 
          tickFormatter={formatYAxisTick}
          ticks={yAxisTicks}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "#666666", fontWeight: 500 }} 
          width={40} 
          domain={[0, yAxisTicks[yAxisTicks.length - 1]]}
          dx={-5} // Shift labels slightly to the left
        />
        <Tooltip content={<ForecastChartTooltip />} />
        <Bar 
          dataKey="value" 
          radius={[10, 10, 10, 10]} // Fully rounded on all corners for pill shape
          barSize={barWidth}
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`}
              fill={entry.isCurrentPeriod ? "#9B87F5" : "#eae6fa"}
              stroke="none"
              opacity={entry.isCurrentPeriod ? 1 : 0.9} // Use full opacity for current day, slightly reduced opacity for future days
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ForecastChartWeeklyView;
