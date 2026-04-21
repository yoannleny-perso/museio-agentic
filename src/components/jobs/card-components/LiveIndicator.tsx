
import React from 'react';
import { Circle } from 'lucide-react';

interface LiveIndicatorProps {
  size?: 'sm' | 'md';
}

const LiveIndicator: React.FC<LiveIndicatorProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5', 
  };
  
  return (
    <div className={`flex items-center gap-1 bg-red-100 text-red-600 ${sizeClasses[size]} rounded-full animate-pulse`}>
      <Circle className="h-2 w-2 fill-red-600" />
      <span className="font-medium">LIVE</span>
    </div>
  );
};

export default LiveIndicator;
