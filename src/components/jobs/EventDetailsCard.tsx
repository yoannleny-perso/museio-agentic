import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, MapPin, Calendar, Clock, Ticket, Phone, User, ArrowLeft, Send } from 'lucide-react';

interface EventDetailsCardProps {
  eventDate?: string;
  eventTime?: string;
  clientName?: string;
  clientEmail?: string;
  eventName?: string;
  location?: string;
  phone?: string;
  onBack?: () => void;
  onSendRequest?: () => void;
}

const EventDetailsCard: React.FC<EventDetailsCardProps> = ({
  eventDate = "July 29th, 2025",
  eventTime = "12:00 - 15:00",
  clientName = "Dr Mehdi Denis Moustaqil",
  clientEmail = "m.moustaqil@gmail.com",
  eventName = "MAS AMOR TIME TEST 4",
  location = "AURA NIGHTCLUB",
  phone = "0468930114",
  onBack,
  onSendRequest
}) => {
  return (
    <Card className="transition-all duration-300 hover:shadow-lg border-0 shadow-sm bg-white">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-slate-900 mb-1">
              DRMENDEZ
            </h3>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {/* Event Information Section */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-3 text-sm text-slate-700 mb-3">
              <div className="flex items-center justify-center w-8 h-8 bg-purple-50 rounded-full">
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <span className="font-medium">{eventDate}</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm text-slate-700 mb-3">
              <div className="flex items-center justify-center w-8 h-8 bg-orange-50 rounded-full">
                <Clock className="w-4 h-4 text-orange-600" />
              </div>
              <span className="font-medium">{eventTime}</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm text-slate-700 mb-3">
              <div className="flex items-center justify-center w-8 h-8 bg-gray-50 rounded-full">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{clientName}</span>
                <span className="text-xs text-slate-500">{clientEmail}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-sm text-slate-700 mb-3">
              <div className="flex items-center justify-center w-8 h-8 bg-pink-50 rounded-full">
                <Ticket className="w-4 h-4 text-pink-600" />
              </div>
              <span className="font-semibold">{eventName}</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm text-slate-700 mb-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-full">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <span>{location}</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm text-slate-700 mb-3">
              <div className="flex items-center justify-center w-8 h-8 bg-green-50 rounded-full">
                <Phone className="w-4 h-4 text-green-600" />
              </div>
              <span>{phone}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {onBack && (
            <Button
              variant="outline"
              onClick={onBack}
              className="flex-1 h-11 font-medium rounded-lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          {onSendRequest && (
            <Button
              onClick={onSendRequest}
              className="flex-1 bg-[#7209B7] hover:bg-[#9B4DFF] text-white h-11 font-medium rounded-lg"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Request
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventDetailsCard;