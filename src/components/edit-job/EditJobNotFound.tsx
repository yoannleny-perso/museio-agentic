
import React from 'react';
import { Button } from '@/components/ui/button';

interface EditJobNotFoundProps {
  navigate: (path: string) => void;
}

const EditJobNotFound = ({ navigate }: EditJobNotFoundProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-4">Job Not Found</h1>
        <p className="mb-6 text-muted-foreground">
          We couldn't find the job you're looking for. It may have been deleted or moved.
        </p>
        <Button onClick={() => navigate('/gigs')}>
          Return to Jobs
        </Button>
      </div>
    </div>
  );
};

export default EditJobNotFound;
