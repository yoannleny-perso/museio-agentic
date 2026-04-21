
import React from 'react';
import { Label } from '@/components/ui/label';
import TimeSelect from '../TimeSelect';

interface TimeRangeFieldProps {
  startTime: string;
  endTime: string;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  hasTimeError: boolean;
  startTimeError?: string;
  endTimeError?: string;
}

const TimeRangeField: React.FC<TimeRangeFieldProps> = ({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  hasTimeError,
  startTimeError,
  endTimeError
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="start_time">Start Time</Label>
        <TimeSelect
          id="start_time"
          value={startTime}
          onChange={onStartTimeChange}
          error={startTimeError}
          aria-label="Job start time"
          includeNextDay={false}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="end_time">End Time</Label>
        <TimeSelect
          id="end_time"
          value={endTime}
          onChange={onEndTimeChange}
          error={hasTimeError ? "End time must be after start time." : endTimeError}
          aria-label="Job end time"
          includeNextDay={false}
        />
      </div>
    </div>
  );
};

export default TimeRangeField;
