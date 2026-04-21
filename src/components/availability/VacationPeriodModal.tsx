import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

interface VacationPeriodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddVacation: (startDate: Date, endDate: Date) => void;
}

const VacationPeriodModal: React.FC<VacationPeriodModalProps> = ({ 
  open, 
  onOpenChange, 
  onAddVacation 
}) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const handleSave = () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error('Please select a date range');
      return;
    }

    onAddVacation(dateRange.from, dateRange.to);
    toast.success('Vacation period added');
    setDateRange(undefined);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setDateRange(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-md rounded-2xl" hideCloseButton={true}>
        {/* Custom Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h1 className="text-xl font-semibold bg-gradient-to-r from-[#A98CFF] to-[#6E59A5] bg-clip-text text-transparent">
            Add Vacation Period
          </h1>
          <button
            onClick={handleCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#A98CFF] text-[#A98CFF] hover:bg-[#A98CFF] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Select vacation dates</Label>
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={1}
              className={cn("p-3 pointer-events-auto")}
              disabled={(date) => date < new Date()}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 p-6 border-t border-border">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Add Vacation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VacationPeriodModal;