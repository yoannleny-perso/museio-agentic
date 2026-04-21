
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface BreakdownEntry {
  name: string;
  value: number;
  fill: string;
}

interface EarningsBreakdownProps {
  entries: BreakdownEntry[];
  formatCurrency: (value: number) => string;
}

const EarningsBreakdown: React.FC<EarningsBreakdownProps> = ({
  entries,
  formatCurrency,
}) => {
  return (
    <Card className="w-full shadow-sm bg-white/90 rounded-xl">
      <CardContent className="p-4">
        <div className="space-y-5">
          {entries.map((entry, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: entry.fill }}
                />
                <span className="text-[#1A1A1A] font-medium">{entry.name}</span>
              </div>
              <span 
                className="font-bold text-lg" 
                style={{ color: entry.fill }}
              >
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default EarningsBreakdown;
