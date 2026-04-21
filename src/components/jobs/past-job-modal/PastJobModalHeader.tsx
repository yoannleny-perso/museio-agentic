
import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { JobStatus } from '@/types';
import JobStatusDisplay from '@/components/jobs/JobStatusDisplay';

interface PastJobModalHeaderProps {
  status: JobStatus;
  onClose: () => void;
}

const PastJobModalHeader: React.FC<PastJobModalHeaderProps> = ({
  status,
  onClose
}) => {
  return (
    <div className="flex shrink-0 items-center justify-between border-b bg-background px-6 py-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold bg-gradient-to-r from-[#8B5CF6] to-[#6E59A5] bg-clip-text text-transparent">
          Complete Job
        </h1>
        <JobStatusDisplay status={status} />
      </div>
      <div className="flex items-center gap-3">
        <Button
  variant="ghost"
  size="icon"
  onClick={onClose}
  className="rounded-full h-9 w-9 border border-[#8B5CF6] bg-transparent text-[#8B5CF6] hover:bg-[#F5F0FF] focus-visible:ring-2 focus-visible:ring-[#8B5CF6] transition-colors duration-200"
  aria-label="Close"
>
  <X className="h-5 w-5" />
  <span className="sr-only">Close</span>
</Button>

      </div>
    </div>
  );
};

export default PastJobModalHeader;
