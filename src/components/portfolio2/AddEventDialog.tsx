import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useModedPortfolioData } from '@/context/PortfolioDataContextModed';
import { cn } from '@/lib/utils';
import PortfolioDialog from './PortfolioDialog';

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventAdded: () => void;
  sectionId?: string;
}

const AddEventDialog: React.FC<AddEventDialogProps> = ({
  open,
  onOpenChange,
  onEventAdded,
  sectionId
}) => {
  const { toast } = useToast();
  const { createEvent } = useModedPortfolioData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    event_name: '',
    event_date: undefined as Date | undefined,
    venue: '',
    location: '',
    ticket_url: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateSelect = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, event_date: date }));
  };

  const validateForm = () => {
    if (!formData.event_name.trim()) {
      toast({
        title: 'Error',
        description: 'Event name is required',
        variant: 'destructive'
      });
      return false;
    }

    if (!formData.event_date) {
      toast({
        title: 'Error',
        description: 'Event date is required',
        variant: 'destructive'
      });
      return false;
    }

    if (!formData.venue.trim()) {
      toast({
        title: 'Error',
        description: 'Venue is required',
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const eventData = {
        event_name: formData.event_name.trim(),
        event_date: format(formData.event_date!, 'yyyy-MM-dd'),
        venue: formData.venue.trim(),
        location: formData.location.trim() || undefined,
        ticket_url: formData.ticket_url.trim() || undefined,
        flyer_image_url: null,
        display_order: 0,
        is_enabled: true
      };

      const result = await createEvent({
        ...eventData,
        section_id: sectionId,
      });
      
      if (result) {
        toast({
          title: 'Success',
          description: 'Event created successfully!'
        });

        setFormData({
          event_name: '',
          event_date: undefined,
          venue: '',
          location: '',
          ticket_url: ''
        });
        
        onEventAdded();
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create event',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        event_name: '',
        event_date: undefined,
        venue: '',
        location: '',
        ticket_url: ''
      });
      onOpenChange(false);
    }
  };

  return (
    <PortfolioDialog
      open={open}
      onOpenChange={handleClose}
      title="Add Event"
      className="max-w-md w-full"
    >

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label 
              htmlFor="event_name"
              className="text-sm font-medium text-foreground"
            >
              Event Name *
            </Label>
            <Input
              id="event_name"
              type="text"
              value={formData.event_name}
              onChange={(e) => handleInputChange('event_name', e.target.value)}
              placeholder="Enter event name"
              disabled={isSubmitting}
              className="focus:ring-2"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Event Date *
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.event_date && "text-muted-foreground"
                  )}
                  disabled={isSubmitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.event_date ? format(formData.event_date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={formData.event_date}
                  onSelect={handleDateSelect}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label 
              htmlFor="venue"
              className="text-sm font-medium text-foreground"
            >
              Venue *
            </Label>
            <Input
              id="venue"
              type="text"
              value={formData.venue}
              onChange={(e) => handleInputChange('venue', e.target.value)}
              placeholder="Enter venue name"
              disabled={isSubmitting}
              className="focus:ring-2"
            />
          </div>

          <div className="space-y-2">
            <Label 
              htmlFor="location"
              className="text-sm font-medium text-foreground"
            >
              Location
            </Label>
            <Input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Enter location (optional)"
              disabled={isSubmitting}
              className="focus:ring-2"
            />
          </div>

          <div className="space-y-2">
            <Label 
              htmlFor="ticket_url"
              className="text-sm font-medium text-foreground"
            >
              Ticket URL
            </Label>
            <Input
              id="ticket_url"
              type="url"
              value={formData.ticket_url}
              onChange={(e) => handleInputChange('ticket_url', e.target.value)}
              placeholder="https://... (optional)"
              disabled={isSubmitting}
              className="focus:ring-2"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                  Adding...
                </>
              ) : (
                'Add Event'
              )}
            </Button>
          </div>
        </form>
    </PortfolioDialog>
  );
};

export default AddEventDialog;
