import React, { useState } from 'react';
import { BookingRequest } from '@/lib/bookingRequests';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ModalTextarea } from '@/components/ui/modal-textarea';
import { Label } from '@/components/ui/label';
import { LoadingButton } from '@/components/ui/loading-button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail, Calendar, MapPin, User, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  BOOKING_RESPONSE_FUNCTION_NAME,
  BOOKING_RESPONSE_TYPE,
  buildBookingResponseRoute,
  parseDateOnlyString,
  type SendBookingResponsePayload,
  type SendBookingResponseResult,
} from '@/contracts';

interface DeclineRequestModalProps {
  request: BookingRequest;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DeclineRequestModal: React.FC<DeclineRequestModalProps> = ({
  request,
  isOpen,
  onClose,
  onSuccess
}) => {
  const eventDate = parseDateOnlyString(request.event_date);
  const [message, setMessage] = useState(
    `Hi ${request.requester_name},\n\nThank you for reaching out regarding the event on ${
      eventDate ? format(eventDate, 'MMMM d, yyyy') : request.event_date
    }.\n\nUnfortunately, I won't be able to take on this booking due to a scheduling conflict. I sincerely apologize for any inconvenience this may cause.\n\nI wish you all the best with your event and hope we can work together in the future.\n\nBest regards`
  );
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSendDecline = async () => {
    if (!message.trim()) {
      toast({
        title: "Missing Message",
        description: "Please provide a message for the decline.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload: SendBookingResponsePayload = {
        type: BOOKING_RESPONSE_TYPE.decline,
        request,
        message,
        return_url: `${window.location.origin}${buildBookingResponseRoute()}`,
      };

      const { data, error } = await supabase.functions.invoke<SendBookingResponseResult>(BOOKING_RESPONSE_FUNCTION_NAME, {
        body: payload,
      });

      if (error) throw error;
      if (data && !data.success) {
        throw new Error(data.error || 'There was an error sending your decline message.');
      }

      toast({
        title: data?.skipped ? "Decline Recorded" : "Decline Sent Successfully",
        description: data?.warning || `Your decline message has been sent to ${request.requester_email}`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error sending decline:', error);
      toast({
        title: "Error Sending Decline",
        description: "There was an error sending your decline message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 max-w-lg max-h-[90vh] rounded-2xl" hideCloseButton={true}>
        <DialogTitle className="sr-only">Decline booking request</DialogTitle>
        <DialogDescription className="sr-only">
          Review the booking request and send a decline message to the requester.
        </DialogDescription>
        <div className="flex flex-col bg-background rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-background rounded-t-2xl">
            <h1 className="text-xl font-semibold bg-gradient-to-r from-[#8B5CF6] to-[#6E59A5] bg-clip-text text-transparent">
              Decline Request
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full h-10 w-10 bg-transparent border border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#F5F0FF] transition"
              disabled={isLoading}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1 px-6 py-5 bg-background max-h-[75vh] overflow-y-auto">
            <div className="space-y-6">
              {/* Email To Section */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Email to:</Label>
                <div className="text-sm text-muted-foreground">{request.requester_email}</div>
              </div>

              {/* Decline Message Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="decline-message" className="text-sm font-medium text-foreground">Message</Label>
                  <ModalTextarea
                    id="decline-message"
                    placeholder="Add a personal message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="bg-background px-6 pt-4 pb-6 border-t">
            <div className="flex flex-col space-y-3">
              <Button 
                variant="outline"
                onClick={onClose} 
                className="flex items-center justify-center h-12 w-full font-medium text-[#6E59A5] border border-[#6E59A5] hover:bg-[#F5F0FF]"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <LoadingButton 
                variant="destructive"
                onClick={handleSendDecline}
                className="flex items-center justify-center h-12 w-full gap-2 bg-red-600 hover:bg-red-700"
                disabled={!message.trim()}
                isLoading={isLoading}
                loadingText="Sending Decline..."
              >
                Send Decline
              </LoadingButton>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeclineRequestModal;
