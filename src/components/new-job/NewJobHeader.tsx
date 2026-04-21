
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NewJobHeaderProps {
  onClose: () => void;
}

const NewJobHeader = ({ onClose }: NewJobHeaderProps) => {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b bg-background">
      <h1 className="text-xl font-semibold">Create New Job</h1>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onClose}
        className="rounded-full h-9 w-9"
      >
        <X className="h-5 w-5" />
        <span className="sr-only">Close</span>
      </Button>
    </div>
  );
};

export default NewJobHeader;
