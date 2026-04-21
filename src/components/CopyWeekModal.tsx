import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, CalendarDays } from 'lucide-react';

interface CopyWeekModalProps {
  onCopy: (targetWeekOffsets: number[]) => Promise<boolean>;
  copying: boolean;
}

export const CopyWeekModal = ({ onCopy, copying }: CopyWeekModalProps) => {
  const [open, setOpen] = useState(false);
  const [selectedWeekCount, setSelectedWeekCount] = useState<string>('');

  const weekOptions = [
    { value: '1', label: 'Next 1 week' },
    { value: '2', label: 'Next 2 weeks' },
    { value: '3', label: 'Next 3 weeks' },
    { value: '4', label: 'Next 4 weeks' },
    { value: '8', label: 'Next 8 weeks' },
    { value: '12', label: 'Next 12 weeks' },
    { value: 'forever', label: 'Forever (52 weeks)' },
  ];

  const handleCopy = async () => {
    if (!selectedWeekCount) return;
    
    const weekCount = selectedWeekCount === 'forever' ? 52 : parseInt(selectedWeekCount);
    const weekOffsetsToUse = Array.from({ length: weekCount }, (_, i) => i + 1);
    
    const success = await onCopy(weekOffsetsToUse);
    if (success) {
      setOpen(false);
      setSelectedWeekCount('');
    }
  };

  const getButtonText = () => {
    if (copying) return 'Copying...';
    if (!selectedWeekCount) return 'Select duration';
    if (selectedWeekCount === 'forever') return 'Copy Forever (52 weeks)';
    const count = parseInt(selectedWeekCount);
    return `Copy to Next ${count} Week${count !== 1 ? 's' : ''}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Copy className="h-4 w-4 mr-2" />
          Copy this week
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Copy this week's schedule
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select how many weeks you want to copy this schedule to:
          </p>
          
          <div className="space-y-3">
            <Select value={selectedWeekCount} onValueChange={setSelectedWeekCount}>
              <SelectTrigger>
                <SelectValue placeholder="Select duration..." />
              </SelectTrigger>
              <SelectContent>
                {weekOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedWeekCount === 'forever' && (
              <p className="text-xs text-muted-foreground">
                This will copy your schedule to the next 52 weeks
              </p>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={copying}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCopy}
              disabled={!selectedWeekCount || copying}
            >
              {getButtonText()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};