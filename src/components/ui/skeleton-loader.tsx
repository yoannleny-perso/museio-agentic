
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonLoaderProps {
  type: 'job-card' | 'job-list' | 'finance-widget' | 'calendar';
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type, count = 3 }) => {
  const renderJobCard = () => (
    <div className="bg-white rounded-lg p-4 border border-gray-100 space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );

  const renderFinanceWidget = () => (
    <div className="bg-white rounded-lg p-6 border border-gray-100 space-y-4">
      <Skeleton className="h-6 w-1/3" />
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      </div>
    </div>
  );

  const renderCalendar = () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-full" />
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (type) {
      case 'job-card':
        return Array.from({ length: count }).map((_, i) => (
          <div key={i}>{renderJobCard()}</div>
        ));
      case 'job-list':
        return (
          <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i}>{renderJobCard()}</div>
            ))}
          </div>
        );
      case 'finance-widget':
        return renderFinanceWidget();
      case 'calendar':
        return renderCalendar();
      default:
        return null;
    }
  };

  return <div className="animate-pulse">{renderContent()}</div>;
};
