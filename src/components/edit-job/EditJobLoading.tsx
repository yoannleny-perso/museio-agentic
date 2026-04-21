
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface EditJobLoadingProps {
  handleClose: () => void;
}

const EditJobLoading = ({ handleClose }: EditJobLoadingProps) => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b bg-background">
        <h1 className="text-xl font-semibold">Loading Draft Job...</h1>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleClose}
          className="rounded-full h-9 w-9"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </Button>
      </div>
      <div className="space-y-4 mt-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
};

export default EditJobLoading;
