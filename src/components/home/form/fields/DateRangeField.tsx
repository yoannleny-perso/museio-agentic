
import React from 'react';
import DatePickerField from '../DatePickerField';

interface DateRangeFieldProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateSelect: (date: Date | undefined) => void;
  onEndDateSelect: (date: Date | undefined) => void;
}

const DateRangeField: React.FC<DateRangeFieldProps> = ({
  startDate,
  endDate,
  onStartDateSelect,
  onEndDateSelect
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="grid gap-2">
        <DatePickerField
          id="date"
          label="Start Date"
          date={startDate || new Date()}
          onDateSelect={onStartDateSelect}
        />
      </div>
      
      <div className="grid gap-2">
        <DatePickerField
          id="end_date"
          label="End Date"
          date={endDate || startDate || new Date()}
          onDateSelect={onEndDateSelect}
        />
      </div>
    </div>
  );
};

export default DateRangeField;
