import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import FormFieldError from './FormFieldError';

interface DatePickerFieldProps {
  id: string;
  label: string;
  date: Date | null;
  onDateSelect: (date: Date | undefined) => void;
  error?: string;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  buttonClassName?: string;
  labelClassName?: string;
  popoverClassName?: string;
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({
  id,
  label,
  date,
  onDateSelect,
  error,
  required = false,
  minDate,
  maxDate,
  buttonClassName,
  labelClassName,
  popoverClassName,
}) => {
  const [open, setOpen] = useState(false);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    onDateSelect(selectedDate);
    setOpen(false);
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className={cn("text-sm font-medium text-black", labelClassName)}>
        {label} {required && <span className="text-black">*</span>}
      </Label>

      <Popover modal={false} open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={id}
            aria-invalid={!!error}
            className={cn(
              "w-full justify-start text-left font-normal px-3 py-2 border rounded-lg bg-white text-black",
              !date && "text-muted-foreground",
              error
                ? "border-red-500 focus-visible:ring-red-500"
                : "focus-visible:ring-museio-purple-light",
              buttonClassName
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-[#8B5CF6]" />
            {date ? format(date, "PPP") : <span>Select a date</span>}
          </Button>
        </PopoverTrigger>

        <PopoverContent className={cn("w-auto p-0 z-[9999]", popoverClassName)} align="start">
          <Calendar
            mode="single"
            selected={date || undefined}
            onSelect={handleDateSelect}
            disabled={(d) =>
              (minDate && d < minDate) || (maxDate && d > maxDate)
            }
            className="p-3"
          />
        </PopoverContent>
      </Popover>

      {error && <FormFieldError error={error} />}
    </div>
  );
};

export default DatePickerField;
