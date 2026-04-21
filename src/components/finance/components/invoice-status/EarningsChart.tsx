
import React, { useMemo } from 'react';

interface ChartEntry {
  name: string;
  value: number;
  fill: string;
}

interface EarningsChartProps {
  chartData: ChartEntry[];
  total: number;
  formatCurrency: (value: number) => string;
}

const EarningsChart: React.FC<EarningsChartProps> = ({
  chartData,
  total,
  formatCurrency
}) => {
  const gradient = useMemo(() => {
    const chartTotal = chartData.reduce((sum, entry) => sum + entry.value, 0);

    if (!chartTotal) {
      return 'conic-gradient(#EAE6FA 0deg 360deg)';
    }

    let startAngle = 0;
    const segments = chartData.map((entry) => {
      const segmentSize = (entry.value / chartTotal) * 360;
      const segment = `${entry.fill} ${startAngle}deg ${startAngle + segmentSize}deg`;
      startAngle += segmentSize;
      return segment;
    });

    return `conic-gradient(${segments.join(', ')})`;
  }, [chartData]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="w-full flex justify-center items-center h-[200px] text-sm text-gray-500">
        No data available for this period.
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <div className="relative w-full max-w-[250px] sm:max-w-[280px] md:max-w-[300px] mx-auto">
        <div className="aspect-square">
          <div className="w-full h-[250px] flex items-center justify-center">
            <div
              aria-hidden="true"
              className="relative h-[220px] w-[220px] rounded-full"
              style={{ backgroundImage: gradient }}
            >
              <div className="absolute inset-[22%] rounded-full bg-white/95 shadow-inner" />
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-neutral-600 text-sm font-medium">Total</p>
            <p className="font-bold text-xl text-neutral-800">
              {formatCurrency(total)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


export default EarningsChart;
