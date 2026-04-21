import React, { useState, useCallback } from 'react';
import { BookingRequest } from '@/lib/bookingRequests';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ModalInput } from '@/components/ui/modal-input';
import { ModalTextarea } from '@/components/ui/modal-textarea';
import { Label } from '@/components/ui/label';
import { LoadingButton } from '@/components/ui/loading-button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail, Calendar, MapPin, MessageSquare, DollarSign, User, Phone, X, Building, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseProfileDetails } from '@/hooks/useSupabaseProfileDetails';
import ClientSelectionField from '@/components/home/form/ClientSelectionField';
import { useSupabaseClients } from '@/hooks/useSupabaseClients';
import {
  BOOKING_RESPONSE_FUNCTION_NAME,
  BOOKING_RESPONSE_TYPE,
  buildBookingResponseRoute,
  parseDateOnlyString,
  type SendBookingResponsePayload,
  type SendBookingResponseResult,
} from '@/contracts';


interface SendQuoteModalProps {
  request: BookingRequest;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SendQuoteModal: React.FC<SendQuoteModalProps> = ({
  request,
  isOpen,
  onClose,
  onSuccess
}) => {
  const eventDate = parseDateOnlyString(request.event_date);
  const [quotePrice, setQuotePrice] = useState('');
  const [message, setMessage] = useState(
    `Hi ${request.requester_name},\n\nThank you for your interest! I'd be delighted to work with you on ${
      eventDate ? format(eventDate, 'MMMM d, yyyy') : request.event_date
    }.\n\nPlease find my quote below. I look forward to hearing from you!\n\nBest regards`
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isClientSaving, setIsClientSaving] = useState(false);
  const [isClientSaved, setIsClientSaved] = useState(false);
  
  // Client-related state
  const [clientValue, setClientValue] = useState(request.requester_name || '');
  const [clientData, setClientData] = useState({
    contact_name: request.requester_name || '',
    location: request.location || '',
    email_address: request.requester_email || '',
    phone: request.phone || '',
  });
  const [clientId, setClientId] = useState<string | null>(null);
  const [isExistingClientSelected, setIsExistingClientSelected] = useState(false);

  const { toast } = useToast();
  const { profileData } = useSupabaseProfileDetails();
  const { findOrCreateClient } = useSupabaseClients();

  // Client handling callbacks
  const handleClientDataChange = useCallback(
    (newClientData: typeof clientData) => {
      setClientData(newClientData);
    },
    []
  );

  const handleClientIdChange = useCallback(
    (newClientId: string | null) => {
      setClientId(newClientId);
    },
    []
  );

  const handleClientSelectionChange = useCallback((isExisting: boolean) => {
    setIsExistingClientSelected(isExisting);
    // Reset save state when client selection changes
    setIsClientSaved(false);
  }, []);

  const handleSaveClient = async () => {
    if (!clientValue.trim() || isExistingClientSelected) return;
    
    setIsClientSaving(true);
    try {
      await findOrCreateClient({
        venue_name: clientValue,
        contact_name: clientData.contact_name,
        email_address: clientData.email_address,
        location: clientData.location,
        phone: clientData.phone,
      });
      
      setIsClientSaved(true);
      toast({
        title: "Client Saved",
        description: "Client has been saved to your database",
      });
    } catch (error) {
      console.error('Failed to save client:', error);
      toast({
        title: "Error Saving Client",
        description: "There was an error saving the client. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsClientSaving(false);
    }
  };

  const handleSendQuote = async () => {
    if (!quotePrice || !message) {
      toast({
        title: "Missing Information",
        description: "Please fill in both the quote price and message.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload: SendBookingResponsePayload = {
        type: BOOKING_RESPONSE_TYPE.quote,
        request,
        quote_price: parseFloat(quotePrice),
        message,
        user_email: profileData?.email,
        return_url: `${window.location.origin}${buildBookingResponseRoute()}`,
      };

      const { data, error } = await supabase.functions.invoke<SendBookingResponseResult>(BOOKING_RESPONSE_FUNCTION_NAME, {
        body: payload,
      });

      if (error) throw error;
      if (data && !data.success) {
        throw new Error(data.error || 'There was an error sending your quote.');
      }

      toast({
        title: data?.skipped ? "Quote Recorded" : "Quote Sent Successfully",
        description: data?.warning || `Your quote has been sent to ${request.requester_email}`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error sending quote:', error);
      toast({
        title: "Error Sending Quote",
        description: "There was an error sending your quote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl p-0"
        hideCloseButton={true}
      >
        <DialogTitle className="sr-only">Send quote</DialogTitle>
        <DialogDescription className="sr-only">
          Prepare and send a quote response for this booking request.
        </DialogDescription>
        <div className="flex min-h-0 flex-1 flex-col bg-background rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-background rounded-t-2xl">
            <h1 className="text-xl font-semibold bg-gradient-to-r from-[#8B5CF6] to-[#6E59A5] bg-clip-text text-transparent">
              Send Quote
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
          <ScrollArea className="min-h-0 flex-1 bg-background">
            <div className="space-y-6 px-6 py-5">
              {/* Email To Section */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Email to:</Label>
                <div className="text-sm text-muted-foreground">{request.requester_email}</div>
              </div>

              {/* Client Selection Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-medium text-foreground">Client Information</Label>
                </div>
                
                <ClientSelectionField
                  value={clientValue}
                  onChange={setClientValue}
                  onClientDataChange={handleClientDataChange}
                  onClientIdChange={handleClientIdChange}
                  onClientSelectionChange={handleClientSelectionChange}
                  disabled={isLoading}
                  initialEmail={request.requester_email}
                  showIndividualFields={true}
                  defaultToManualEntry={true}
                />

                {/* Save Client Button */}
                {!isExistingClientSelected && !isClientSaved && (
                  <div className="pt-2">
                    <LoadingButton
                      variant="outline"
                      size="sm"
                      onClick={handleSaveClient}
                      isLoading={isClientSaving}
                      loadingText="Saving..."
                      className="h-9 text-xs font-medium"
                      disabled={isLoading}
                    >
                      <UserPlus className="h-3 w-3 mr-2" />
                      Save as Client
                    </LoadingButton>
                  </div>
                )}
                
                {/* Client Saved Indicator */}
                {isClientSaved && (
                  <div className="pt-2">
                    <div className="text-xs text-green-600 font-medium flex items-center">
                      <UserPlus className="h-3 w-3 mr-1" />
                      Client saved successfully
                    </div>
                  </div>
                )}
              </div>

              {/* Quote Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quote-price" className="text-sm font-medium text-foreground">Your Quote (AUD $)</Label>
                  <ModalInput
                    id="quote-price"
                    type="number"
                    placeholder="Enter your quote price"
                    value={quotePrice}
                    onChange={(e) => setQuotePrice(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quote-message" className="text-sm font-medium text-foreground">Message</Label>
                  <ModalTextarea
                    id="quote-message"
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
                onClick={handleSendQuote}
                className="flex items-center justify-center h-12 w-full gap-2"
                disabled={!quotePrice || !message}
                isLoading={isLoading}
                loadingText="Sending Quote..."
              >
                Send Quote
              </LoadingButton>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendQuoteModal;
