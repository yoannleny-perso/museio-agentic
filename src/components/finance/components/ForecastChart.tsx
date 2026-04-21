
import React from 'react';
import { Job } from '@/types';
import ForecastChartContainer from './ForecastChartContainer';

// Props for the component
interface ForecastChartProps {
  jobs: Job[];
  forecastRange: string;
  isEmpty: boolean;
  totalForecast: number;
  confirmedCount: number;
}

const ForecastChart: React.FC<ForecastChartProps> = (props) => {
  return <ForecastChartContainer {...props} />;
};

export default ForecastChart;
