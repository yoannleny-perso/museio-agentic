import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, CalendarX, Trash2, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import VacationPeriodModal from './VacationPeriodModal';
import { useUserAvailability } from '@/hooks/useUserAvailability';

interface DayAvailability {
  day: string;
  enabled: boolean;
  fromTime: string;
  toTime: string;
}

interface VacationPeriod {
  id: string;
  startDate: Date;
  endDate: Date;
}

interface MoreOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availability: DayAvailability[];
  onUpdateAvailability: (availability: DayAvailability[]) => void;
  // Remove vacation props since we'll use the hook
  vacationPeriods?: any[];
  onUpdateVacationPeriods?: (periods: any[]) => void;
}

const MoreOptionsModal: React.FC<MoreOptionsModalProps> = ({ 
  open, 
  onOpenChange, 
  availability, 
  onUpdateAvailability,
  vacationPeriods,
  onUpdateVacationPeriods
}) => {
  const {
    settings,
    settingsLoading,
    settingsSaving,
    saveSettings,
    vacationPeriods: hookVacationPeriods,
    vacationPeriodsLoading,
    addVacationPeriod,
    removeVacationPeriod,
  } = useUserAvailability();

  const [localSettings, setLocalSettings] = useState({
    bufferTime: settings.buffer_time_minutes.toString(),
    minNotice: settings.min_notice_hours.toString(),
    enableBreaks: settings.enable_breaks,
    breakDuration: settings.break_duration_minutes.toString(),
  });

  const [vacationModalOpen, setVacationModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Sync settings when they change
  useEffect(() => {
    setLocalSettings({
      bufferTime: settings.buffer_time_minutes.toString(),
      minNotice: settings.min_notice_hours.toString(),
      enableBreaks: settings.enable_breaks,
      breakDuration: settings.break_duration_minutes.toString(),
    });
  }, [settings]);

  const handleSave = async () => {
    const success = await saveSettings({
      buffer_time_minutes: parseInt(localSettings.bufferTime),
      min_notice_hours: parseInt(localSettings.minNotice),
      enable_breaks: localSettings.enableBreaks,
      break_duration_minutes: parseInt(localSettings.breakDuration),
    });

    if (success) {
      onOpenChange(false);
    }
  };

  const handleBulkAction = (action: string) => {
    switch (action) {
      case 'clear-all': {
        const clearedAvailability = availability.map(day => ({
          ...day,
          enabled: false
        }));
        onUpdateAvailability(clearedAvailability);
        setSelectedTemplate(null);
        toast.success('All schedules cleared');
        break;
      }
      case 'add-vacation':
        setVacationModalOpen(true);
        break;
      case 'template-9to5': {
        const nineTo5Availability = availability.map(day => ({
          ...day,
          enabled: true,
          fromTime: '09:00',
          toTime: '17:00'
        }));
        onUpdateAvailability(nineTo5Availability);
        setSelectedTemplate('template-9to5');
        toast.success('9-5 template applied to all days');
        break;
      }
      case 'template-evening': {
        const eveningAvailability = availability.map(day => ({
          ...day,
          enabled: true,
          fromTime: '18:00',
          toTime: '23:00'
        }));
        onUpdateAvailability(eveningAvailability);
        setSelectedTemplate('template-evening');
        toast.success('Evening template applied to all days');
        break;
      }
      case 'template-weekend': {
        const weekendAvailability = availability.map((day, index) => {
          if (index <= 3) { // Mon-Thu (0-3)
            return { ...day, enabled: false };
          } else if (index === 4) { // Friday (4)
            return { ...day, enabled: true, fromTime: '17:00', toTime: '24:00' };
          } else if (index === 5) { // Saturday (5)
            return { ...day, enabled: true, fromTime: '00:00', toTime: '24:00' };
          } else { // Sunday (6)
            return { ...day, enabled: true, fromTime: '00:00', toTime: '21:00' };
          }
        });
        onUpdateAvailability(weekendAvailability);
        setSelectedTemplate('template-weekend');
        toast.success('Weekend-only template applied');
        break;
      }
    }
  };

  const handleAddVacation = async (startDate: Date, endDate: Date) => {
    await addVacationPeriod(startDate, endDate);
  };

  const handleRemoveVacation = async (id: string) => {
    await removeVacationPeriod(id);
  };

  const formatDateRange = (startDate: Date, endDate: Date) => {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    };
    
    if (startDate.toDateString() === endDate.toDateString()) {
      return formatDate(startDate);
    }
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  // Use hookVacationPeriods instead of vacationPeriods prop
  const displayVacationPeriods = hookVacationPeriods || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-lg max-h-[90vh] rounded-2xl" hideCloseButton={true}>
        {/* Custom Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h1 className="text-xl font-semibold bg-gradient-to-r from-[#A98CFF] to-[#6E59A5] bg-clip-text text-transparent">
            More Availability Options
          </h1>
          <button
            onClick={() => onOpenChange(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#A98CFF] text-[#A98CFF] hover:bg-[#A98CFF] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1">
          <div className="px-6 py-5 space-y-6">
            {/* Quick Templates */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold bg-gradient-to-r from-[#A98CFF] to-[#6E59A5] bg-clip-text text-transparent">Quick Templates</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="space-y-2 text-xs">
                          <p><strong>9-5 Schedule:</strong> Sets all days to 9 AM - 5 PM</p>
                          <p><strong>Evening Shifts:</strong> Sets all days to 6 PM - 11 PM</p>
                          <p><strong>Weekend Only:</strong> Friday evening + full Saturday + Sunday until 9 PM</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {selectedTemplate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(null);
                      toast.success("Template selection cleared");
                    }}
                    className="h-6 px-2 text-xs text-[#6E59A5] hover:text-[#5a4d8a]"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleBulkAction('template-9to5')}
                  className={`text-xs transition-all duration-200 ${
                    selectedTemplate === 'template-9to5' 
                      ? 'bg-gradient-to-r from-[#A98CFF]/10 to-[#6E59A5]/10 text-[#6E59A5] border-[#A98CFF]/30' 
                      : ''
                  }`}
                >
                  9-5 Schedule
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleBulkAction('template-evening')}
                  className={`text-xs transition-all duration-200 ${
                    selectedTemplate === 'template-evening' 
                      ? 'bg-gradient-to-r from-[#A98CFF]/10 to-[#6E59A5]/10 text-[#6E59A5] border-[#A98CFF]/30' 
                      : ''
                  }`}
                >
                  Evening Shifts
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleBulkAction('template-weekend')}
                  className={`text-xs transition-all duration-200 ${
                    selectedTemplate === 'template-weekend' 
                      ? 'bg-gradient-to-r from-[#A98CFF]/10 to-[#6E59A5]/10 text-[#6E59A5] border-[#A98CFF]/30' 
                      : ''
                  }`}
                >
                  Weekend Only
                </Button>
              </div>
              
              {/* Template Description */}
              {selectedTemplate && (
                <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-muted">
                  <p className="text-xs text-gray-600">
                    {selectedTemplate === 'template-9to5' && 
                      'Sets availability Monday through Sunday, 9:00 AM to 5:00 PM for standard business hours'
                    }
                    {selectedTemplate === 'template-evening' && 
                      'Sets availability Monday through Sunday, 6:00 PM to 11:00 PM for evening work'
                    }
                    {selectedTemplate === 'template-weekend' && 
                      'Sets Friday 5:00 PM - 11:59 PM, Saturday all day, and Sunday until 9:00 PM'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Vacation Periods */}
            <div>
              <h3 className="text-base font-semibold mb-3 bg-gradient-to-r from-[#A98CFF] to-[#6E59A5] bg-clip-text text-transparent">
                Vacation Periods
              </h3>
              {displayVacationPeriods.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-[rgba(122,83,255,0.2)] rounded-lg">
                  <CalendarX className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">No vacation periods scheduled</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkAction('add-vacation')}
                    className="text-xs"
                  >
                    Add First Vacation Period
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {displayVacationPeriods.map((period) => (
                    <div key={period.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-[rgba(122,83,255,0.1)]">
                      <div className="flex items-center gap-2">
                        <CalendarX className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {formatDateRange(period.startDate, period.endDate)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveVacation(period.id)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkAction('add-vacation')}
                    className="text-xs w-full mt-2"
                  >
                    Add Another Vacation Period
                  </Button>
                </div>
              )}
            </div>

            {/* Time Management */}
            <div>
              <h3 className="text-base font-semibold mb-3 bg-gradient-to-r from-[#A98CFF] to-[#6E59A5] bg-clip-text text-transparent">Time Management</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bufferTime" className="text-xs">Buffer time between bookings</Label>
                    <Select value={localSettings.bufferTime} onValueChange={(value) => setLocalSettings({...localSettings, bufferTime: value})}>
                      <SelectTrigger id="bufferTime" className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0" className="text-xs">No buffer</SelectItem>
                        <SelectItem value="15" className="text-xs">15 minutes</SelectItem>
                        <SelectItem value="30" className="text-xs">30 minutes</SelectItem>
                        <SelectItem value="60" className="text-xs">1 hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="minNotice" className="text-xs">Minimum notice period (hours)</Label>
                    <Select value={localSettings.minNotice} onValueChange={(value) => setLocalSettings({...localSettings, minNotice: value})}>
                      <SelectTrigger id="minNotice" className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1" className="text-xs">1 hour</SelectItem>
                        <SelectItem value="24" className="text-xs">24 hours</SelectItem>
                        <SelectItem value="48" className="text-xs">48 hours</SelectItem>
                        <SelectItem value="168" className="text-xs">1 week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch 
                    id="enableBreaks"
                    checked={localSettings.enableBreaks}
                    onCheckedChange={(checked) => setLocalSettings({...localSettings, enableBreaks: checked})}
                  />
                  <Label htmlFor="enableBreaks" className="text-xs">Enable break times</Label>
                </div>

                {localSettings.enableBreaks && (
                  <div className="ml-6">
                    <Label htmlFor="breakDuration" className="text-xs">Default break duration (minutes)</Label>
                    <Input
                      id="breakDuration"
                      type="number"
                      value={localSettings.breakDuration}
                      onChange={(e) => setLocalSettings({...localSettings, breakDuration: e.target.value})}
                      className="w-32 text-xs"
                    />
                  </div>
                )}
              </div>
            </div>

          </div>
        </ScrollArea>

        {/* Fixed Bottom Actions */}
        <div className="flex justify-end space-x-2 p-6 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </DialogContent>

      {/* Vacation Period Modal */}
      <VacationPeriodModal
        open={vacationModalOpen}
        onOpenChange={setVacationModalOpen}
        onAddVacation={handleAddVacation}
      />
    </Dialog>
  );
};

export default MoreOptionsModal;
