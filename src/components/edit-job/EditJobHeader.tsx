
import React from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditJobHeaderProps {
  onClose: () => void;
}

const EditJobHeader = ({ onClose }: EditJobHeaderProps) => {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b bg-background">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="rounded-full h-9 w-9 mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-xl font-semibold">Edit Job</h1>
      </div>
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

export default EditJobHeader;
