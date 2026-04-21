
import React from 'react';
import { Plus, Menu } from 'lucide-react';
import { PrimaryActionButton } from '@/components/ui/primary-action-button';
import CircularIcon from '@/components/ui/circular-icon';

interface JobsHeaderProps {
  onAddJob?: () => void;
}

const JobsHeader: React.FC<JobsHeaderProps> = ({ onAddJob }) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-50 to-purple-100">
          <Menu className="h-5 w-5 text-[#9b87f5]" />
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#A98CFF] to-[#6E59A5] bg-clip-text text-transparent">Jobs</h1>
      </div>
      {onAddJob && (
        <PrimaryActionButton
          onClick={onAddJob}
          className="px-6 py-2 rounded-full h-12"
          size="sm"
          variant="soft"
        >
          <CircularIcon>
            <Plus className="h-2.5 w-2.5 text-[#9b87f5] animate-pulse" />
          </CircularIcon>
          <span className="text-sm font-semibold text-[#9b87f5]">New Job</span>
        </PrimaryActionButton>
      )}
    </div>
  );
};

export default JobsHeader;
