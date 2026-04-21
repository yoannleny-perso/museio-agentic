import React from 'react';
import { BookingRequest } from '@/lib/bookingRequests';
import BookingRequestCard from './BookingRequestCard';
import EmptyJobsState from './EmptyJobsState';

interface BookingRequestsListProps {
  requests: BookingRequest[];
  onAccept: (request: BookingRequest) => void;
  onDecline: (requestId: string) => void;
  onRemove: (requestId: string) => void;
  onRequestClick?: (request: BookingRequest) => void;
}

const BookingRequestsList: React.FC<BookingRequestsListProps> = ({
  requests,
  onAccept,
  onDecline,
  onRemove,
  onRequestClick
}) => {
  if (requests.length === 0) {
    return (
      <EmptyJobsState 
        title="No booking requests"
        description="Booking requests from your public booking page will appear here."
      />
    );
  }

  return (
    <div className="space-y-10">
      {requests.map((request) => (
        <BookingRequestCard
          key={request.id}
          request={request}
          onAccept={onAccept}
          onDecline={onDecline}
          onRemove={onRemove}
          onClick={onRequestClick}
        />
      ))}
    </div>
  );
};

export default BookingRequestsList;