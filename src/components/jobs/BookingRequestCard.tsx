import React, { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookingRequest } from '@/lib/bookingRequests';
import { Mail, MapPin, Calendar, Trash2, Send, X, Clock, Ticket, DollarSign, FileText, AlertTriangle } from 'lucide-react';
import SendQuoteModal from './SendQuoteModal';
import DeclineRequestModal from './DeclineRequestModal';
import DeleteBookingRequestDialog from './DeleteBookingRequestDialog';
import { useJobsContext } from '@/context/JobsContext';
import {
  getBookingRequestEndDate,
  isMultiDayBookingRequest,
  parseDateOnlyString,
} from '@/contracts';

interface BookingRequestCardProps {
  request: BookingRequest;
  onAccept: (request: BookingRequest) => void;
  onDecline: (requestId: string) => void;
  onRemove: (requestId: string) => void;
  onClick?: (request: BookingRequest) => void;
}

const BookingRequestCard: React.FC<BookingRequestCardProps> = ({
  request,
  onAccept,
  onDecline,
  onRemove,
  onClick
}) => {
  const { setIsQuoteModalOpen } = useJobsContext();
  const [isQuoteModalOpen, setIsQuoteModalOpenLocal] = useState(false);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const handleCardClick = () => {
    if (onClick) {
      onClick(request);
    }
  };

const handleSendQuote = (e: React.MouseEvent) => {
  e.stopPropagation();
  setIsQuoteModalOpenLocal(true);
  setIsQuoteModalOpen(true);
};

  const handleDeclineClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeclineModalOpen(true);
  };

  const handleQuoteSuccess = () => {
    onAccept(request);
  };

  const handleDeclineSuccess = () => {
    onDecline(request.id);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    onRemove(request.id);
  };

  const formatEventDate = () => {
    const startDate = parseDateOnlyString(request.event_date);
    const endDate = parseDateOnlyString(
      getBookingRequestEndDate(request.event_date, request.event_end_date)
    );

    if (!startDate || !endDate) {
      return request.event_date;
    }

    if (
      !isMultiDayBookingRequest(request.event_date, request.event_end_date)
    ) {
      return format(startDate, 'EEEE, MMMM d, yyyy');
    }

    return `${format(startDate, 'EEEE, MMMM d, yyyy')} - ${format(
      endDate,
      'EEEE, MMMM d, yyyy'
    )}`;
  };

  const formatEventTime = (): string | null => {
    if (request.event_start_time && request.event_end_time) {
      return `${request.event_start_time.slice(0, 5)} - ${request.event_end_time.slice(0, 5)}`;
    }
    if (request.event_start_time) {
      return request.event_start_time.slice(0, 5);
    }
    
    return null;
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'badge-pending-bg badge-pending-text badge-pending-border';
      case 'quoted':
        return 'bg-green-50 text-green-800 border-green-300';
      case 'declined':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getShadowClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'booking-card-shadow-pending';
      case 'quoted':
        return 'booking-card-shadow-quoted';
      case 'declined':
        return 'booking-card-shadow-declined';
      default:
        return 'booking-card-shadow-base';
    }
  };

  return (
    <>
      <Card 
        className={`border-0 bg-white ${getShadowClass(request.status)}`}
      >
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-slate-900 mb-1">
                {request.requester_name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail className="w-4 h-4" />
                <span>{request.requester_email}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline"
                className={`${getStatusColor(request.status || 'pending')} px-3 py-1 text-xs font-medium rounded-full ${(request.status || 'pending') === 'pending' ? 'new-request-pulse' : ''}`}
              >
                {(request.status || 'pending') === 'pending' ? 'New Request' : request.status}
              </Badge>
              {request.status === 'pending' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  className="text-slate-500 hover:text-slate-600 hover:bg-slate-50 h-8 w-8 p-0 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {/* Event Information Section */}
            <div className="pt-2 border-t border-slate-100">
              {request.event_name && (
                <div className="flex items-center gap-3 text-sm text-slate-700 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-pink-50 rounded-full">
                    <Ticket className="w-4 h-4 text-pink-600" />
                  </div>
                  <span className="font-semibold">{request.event_name}</span>
                </div>
              )}
              
              <div className="flex items-center gap-3 text-sm text-slate-700 mb-3">
                <div className="flex items-center justify-center w-8 h-8 bg-purple-50 rounded-full">
                  <Calendar className="w-4 h-4 text-purple-600" />
                </div>
                <span className="font-medium">{formatEventDate()}</span>
              </div>
              
              {formatEventTime() && (
                <div className="flex items-center gap-3 text-sm text-slate-700 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-50 rounded-full">
                    <Clock className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="font-medium">{formatEventTime()}</span>
                </div>
              )}
              
              {request.location && (
                <div className="flex items-center gap-3 text-sm text-slate-700 mb-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-full">
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </div>
                  <span>{request.location}</span>
                </div>
              )}

              {/* Budget Section */}
              {request.budget && (
                <div className="flex items-center gap-3 text-sm text-slate-700 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-50 rounded-full">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-semibold text-green-700">
                    Budget: ${Number(request.budget).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Additional Information Section */}
            {(request.event_description || request.special_requirements) && (
              <div className="pt-4 border-t border-slate-100">
                {request.event_description && (
                  <div className="bg-blue-50/50 p-3 rounded-lg mb-3">
                    <div className="flex items-start gap-3 text-sm text-slate-700">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-full flex-shrink-0">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-600 mb-1">Event Description</h4>
                        <p className="text-slate-700 leading-relaxed">
                          {request.event_description}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {request.special_requirements && (
                  <div className="bg-yellow-50/50 p-3 rounded-lg mb-3">
                    <div className="flex items-start gap-3 text-sm text-slate-700">
                      <div className="flex items-center justify-center w-8 h-8 bg-yellow-50 rounded-full flex-shrink-0">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-yellow-600 mb-1">Special Requirements</h4>
                        <p className="text-slate-700 leading-relaxed">
                          {request.special_requirements}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {request.status === 'pending' && (
            <div className="flex gap-3">
              <Button
                onClick={handleSendQuote}
                className="flex-1 bg-[#7209B7] hover:bg-[#9B4DFF] text-white h-11 font-medium rounded-lg"
              >
                <Send className="w-4 h-4 mr-2" />
                Send a Quote
              </Button>
              <Button
                variant="soft-destructive"
                onClick={handleDeclineClick}
                className="flex-1 h-11 font-medium rounded-lg"
              >
                <X className="w-4 h-4 mr-2" />
                Decline
              </Button>
            </div>
          )}

          {request.status !== 'pending' && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-slate-500 hover:text-slate-600 hover:bg-slate-50 h-10 px-4 rounded-lg"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

<SendQuoteModal
  request={request}
  isOpen={isQuoteModalOpen}
  onClose={() => { setIsQuoteModalOpenLocal(false); setIsQuoteModalOpen(false); }}
  onSuccess={handleQuoteSuccess}
/>

      <DeclineRequestModal
        request={request}
        isOpen={isDeclineModalOpen}
        onClose={() => setIsDeclineModalOpen(false)}
        onSuccess={handleDeclineSuccess}
      />

      <DeleteBookingRequestDialog
        request={request}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default BookingRequestCard;
