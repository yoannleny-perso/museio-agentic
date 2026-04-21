
import React from 'react';
import { CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { PrimaryActionButton } from '@/components/ui/primary-action-button';
import CircularIcon from '@/components/ui/circular-icon';

interface EmptyJobsProps {
  onAddJob?: () => void;
}

const EmptyJobs: React.FC<EmptyJobsProps> = ({ onAddJob }) => {
  return (
    <div className="flex flex-col items-center justify-center py-6 min-h-[72px] text-center rounded-lg bg-gradient-to-br from-[#F9F7FF] to-[rgba(255,255,255,0.75)] shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.05)] mt-4">
      <p className="text-gray-500 mb-3">No jobs for this date</p>
      <PrimaryActionButton 
        onClick={onAddJob}
        variant="soft"
        size="sm"
        className="font-medium"
      >
        <CircularIcon>
          <Plus className="h-2.5 w-2.5 text-[#9b87f5]" />
        </CircularIcon>
        Add a job
      </PrimaryActionButton>
    </div>
  );
};

export default EmptyJobs;
