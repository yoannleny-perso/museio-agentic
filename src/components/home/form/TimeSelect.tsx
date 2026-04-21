
import React, { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateTimeOptions, formatTimeDisplay } from '@/lib/utils';

interface TimeSelectProps {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  "aria-label"?: string;
  disabled?: boolean;
  includeNextDay?: boolean; // Whether to include next-day times
  triggerClassName?: string;
  labelClassName?: string;
}

const TimeSelect = ({ 
  id, 
  label, 
  value, 
  onChange, 
  error, 
  "aria-label": ariaLabel,
  disabled = false,
  includeNextDay = true, // Default to true for backward compatibility
  triggerClassName,
  labelClassName,
}: TimeSelectProps) => {
  const timeOptions = generateTimeOptions(15, includeNextDay);
  
  // Clean up the time format if needed (remove seconds)
  const formattedValue = value?.includes(':') 
    ? value.split(':').slice(0, 2).join(':') 
    : value;
    
  useEffect(() => {
    // If the exact value isn't in our options, find the closest one
    if (formattedValue && !timeOptions.includes(formattedValue)) {
      console.log(`Time value "${formattedValue}" not found in options, finding nearest match`);
      // Find the closest time option
      const nearestOption = timeOptions.find(option => option >= formattedValue) || timeOptions[0];
      onChange(nearestOption);
    }
  }, [formattedValue, onChange, timeOptions]);

  return (
    <div className="grid gap-2">
      {label && <Label htmlFor={id} className={labelClassName}>{label}</Label>}
      <Select 
        value={formattedValue} 
        onValueChange={onChange}
        defaultValue={timeOptions[0]}
        disabled={disabled}
      >
        <SelectTrigger 
          id={id} 
          className={cn(
            "input-field focus-visible:ring-museio-purple-light", 
            error ? "border-red-500 focus-visible:ring-red-500" : "",
            triggerClassName
          )}
          aria-invalid={!!error}
          aria-label={ariaLabel || `Select ${label || 'time'}`}
          disabled={disabled}
        >
          <SelectValue placeholder="Select time" />
        </SelectTrigger>
        <SelectContent>
          {timeOptions.map((time) => (
            <SelectItem key={time} value={time}>
              {formatTimeDisplay(time)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

export default TimeSelect;
