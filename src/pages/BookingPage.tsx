import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import SecureCalendar from '@/components/booking/SecureCalendar';
import SecureTimePicker from '@/components/booking/SecureTimePicker';
import TurnstileWidget from '@/components/booking/TurnstileWidget';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Calendar as CalendarIcon, Clock, User, MapPin, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { useBookingAvailability } from '@/hooks/useBookingAvailability';
import { BOOKING_SUBMISSION_FUNCTION_NAME } from '@/contracts';

interface Artist {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string;
  email: string;
}

interface BookingFormData {
  selectedDate: Date | null;
  endDate: Date | null;
  startTime: string;
  endTime: string;
  guestName: string;
  guestEmail: string;
  eventName: string;
  eventDescription: string;
  location: string;
  budget: string;
  contactPhone: string;
  message: string;
  companyWebsite: string;
}

type ViewMode = 'details' | 'confirmation';

interface BookingPageProps {
  variant?: 'page' | 'modal';
  username?: string;
  onClose?: () => void;
  themeColors?: any;
}


const BookingPage: React.FC<BookingPageProps> = ({ 
  variant = 'page', 
  username: propUsername,
  onClose,
  themeColors 
}) => {
  const { username: routeUsername, nickname: routeNickname } = useParams<{ username?: string; nickname?: string }>();
  const effectiveUsername = propUsername || routeUsername || routeNickname;
  
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('details');
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [captchaWidgetKey, setCaptchaWidgetKey] = useState(0);
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? '';
  const [formData, setFormData] = useState<BookingFormData>({
    selectedDate: null,
    endDate: null,
    startTime: '',
    endTime: '',
    guestName: '',
    guestEmail: '',
    eventName: '',
    eventDescription: '',
    location: '',
    budget: '',
    contactPhone: '',
    message: '',
    companyWebsite: ''
  });

  // Add booking availability hook
  const { getAvailableSlots } = useBookingAvailability(artist?.id);

  

  useEffect(() => {
    const fetchArtist = async () => {
      if (!effectiveUsername) {
        setLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('portfolio_settings')
          .select('user_id, artist_name, username, is_public')
          .eq('username', effectiveUsername)
          .eq('is_public', true)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          const artistData: Artist = {
            id: data.user_id as string,
            first_name: '',
            last_name: '',
            nickname: (data.artist_name as string) || (data.username as string) || '',
            email: ''
          };
          setArtist(artistData);
        }
      } catch (error) {
        console.error('Error fetching artist by username:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtist();
  }, [effectiveUsername]);


  const handleDateSelection = (date: Date) => {
    // Set default 1-hour booking if times are empty
    let defaultStartTime = '';
    let defaultEndTime = '';
    
    // Only set defaults if both times are currently empty
    if (!formData.startTime && !formData.endTime) {
      const dateStr = format(date, 'yyyy-MM-dd');
      const availableSlots = getAvailableSlots(dateStr);
      
      // Try default 7:00 PM - 8:00 PM first
      const preferredStart = '19:00';
      const preferredEnd = '20:00';
      
      // Check if preferred time is available
      const isPreferredAvailable = availableSlots.some(slot => 
        slot.start <= preferredStart && slot.end >= preferredEnd
      );
      
      if (isPreferredAvailable) {
        defaultStartTime = preferredStart;
        defaultEndTime = preferredEnd;
      } else if (availableSlots.length > 0) {
        // Find first 1-hour slot from available slots
        const firstSlot = availableSlots[0];
        const startHour = parseInt(firstSlot.start.split(':')[0]);
        const startMinute = parseInt(firstSlot.start.split(':')[1]);
        const endHour = parseInt(firstSlot.end.split(':')[0]);
        const endMinute = parseInt(firstSlot.end.split(':')[1]);
        
        // Calculate if we can fit a 1-hour slot
        const slotDurationMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
        
        if (slotDurationMinutes >= 60) {
          defaultStartTime = firstSlot.start;
          // Add 1 hour to start time
          const newEndHour = startHour + 1;
          defaultEndTime = `${newEndHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
        }
      }
    }
    
    const newFormData = {
      ...formData, 
      selectedDate: date, 
      endDate: null,
      startTime: defaultStartTime, 
      endTime: defaultEndTime
    };
    setFormData(newFormData);
  };

  const handleTimeSelection = (startTime: string, endTime: string, endDate?: Date) => {
    const newFormData = {
      ...formData, 
      startTime, 
      endTime,
      endDate: endDate || null
    };
    setFormData(newFormData);
  };


  const handleNext = () => {
    if (viewMode === 'details') {
      if (currentStep === 1 && formData.selectedDate) {
        setCurrentStep(2);
      } else if (currentStep === 2 && formData.startTime && formData.endTime) {
        setCurrentStep(3);
      } else if (currentStep === 3 && formData.guestName.trim() && formData.guestEmail.trim()) {
        setCurrentStep(4);
      } else if (currentStep === 4 && formData.location.trim()) {
        setViewMode('confirmation');
        setCurrentStep(5);
      }
    }
  };

  const handleBack = () => {
    if (viewMode === 'details') {
      if (currentStep === 2) {
        setCurrentStep(1);
      } else if (currentStep === 3) {
        setCurrentStep(2);
      } else if (currentStep === 4) {
        setCurrentStep(3);
      }
    } else if (viewMode === 'confirmation') {
      setViewMode('details');
      setCurrentStep(4);
    }
  };

  const handleSkip = () => {
    if (currentStep === 4) {
      setViewMode('confirmation');
      setCurrentStep(5);
    }
  };

  const handleSubmitBooking = async () => {
    if (!artist || !formData.selectedDate) return;

    // Validate time values before submission
    if (!formData.startTime || !formData.endTime) {
      setSubmitError('Please select a valid start and end time before sending your booking request.');
      return;
    }

    if (turnstileSiteKey && !captchaToken) {
      setSubmitError('Please complete the verification before sending your booking request.');
      return;
    }

    setSubmitError(null);
    setSubmitting(true);
    try {
      const bookingData = {
        portfolio_user_id: artist.id,
        requester_name: formData.guestName,
        requester_email: formData.guestEmail,
        event_date: format(formData.selectedDate, 'yyyy-MM-dd'),
        event_end_date: format(
          formData.endDate || formData.selectedDate,
          'yyyy-MM-dd'
        ),
        event_start_time: formData.startTime,
        event_end_time: formData.endTime,
        location: formData.location,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        phone: formData.contactPhone || null,
        event_name: formData.eventName || null,
        event_description: formData.eventDescription || null,
        special_requirements: formData.message || null,
        company_website: formData.companyWebsite || null,
        captcha_token: captchaToken || null,
      };

      const { data, error } = await supabase.functions.invoke(
        BOOKING_SUBMISSION_FUNCTION_NAME,
        {
          body: bookingData,
        }
      );

      if (error) throw error;
      if (data?.error) {
        throw new Error(data.error);
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting booking:', error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'We could not send your booking request. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };


	  const renderStepContent = () => {
	    switch (currentStep) {
	      case 1:
	        return (
	          <SecureCalendar
	            artistId={artist?.id}
	            onSelectDate={handleDateSelection}
	            selectedDate={formData.selectedDate || undefined}
	            variant="embedded"
	          />
	        );

      case 2:
        return (
          <SecureTimePicker
            key={formData.selectedDate ? format(formData.selectedDate, 'yyyy-MM-dd') : 'no-date'}
            startTime={formData.startTime}
            endTime={formData.endTime}
            onSelectTimeRange={handleTimeSelection}
            selectedDate={formData.selectedDate}
            artistId={artist?.id}
            variant="embedded"
          />
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-gray-800">Contact Details</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-gray-700 font-medium">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.guestName}
                  onChange={(e) => setFormData({...formData, guestName: e.target.value})}
                  placeholder="Enter your full name"
                  className="bg-white/80 backdrop-blur-lg border border-white/40 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-museio-purple"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-gray-700 font-medium">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.guestEmail}
                  onChange={(e) => setFormData({...formData, guestEmail: e.target.value})}
                  placeholder="Enter your email address"
                  className="bg-white/80 backdrop-blur-lg border border-white/40 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-museio-purple"
                />
              </div>
              <div>
                <Label htmlFor="contactPhone" className="text-gray-700 font-medium">Phone Number (optional)</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                  placeholder="Your phone number"
                  className="bg-white/80 backdrop-blur-lg border border-white/40 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-museio-purple"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-gray-800">Event Details</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="eventName" className="text-gray-700 font-medium">Event Name/Brand *</Label>
                <Input
                  id="eventName"
                  value={formData.eventName}
                  onChange={(e) => setFormData({...formData, eventName: e.target.value})}
                  placeholder="e.g., Wedding Reception, Corporate Event, Birthday Party"
                  className="bg-white/80 backdrop-blur-lg border border-white/40 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-museio-purple"
                />
              </div>
              <div>
                <Label htmlFor="location" className="text-gray-700 font-medium">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Event venue or address"
                  className="bg-white/80 backdrop-blur-lg border border-white/40 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-museio-purple"
                />
              </div>
              
              {/* More Options Toggle Button */}
              <button
                type="button"
                onClick={() => setShowMoreOptions(!showMoreOptions)}
                className="flex items-center justify-center w-full py-2 bg-transparent text-gray-600 text-sm font-normal hover:bg-gray-100/20 transition-all duration-300 focus:ring-2 focus:ring-museio-purple focus:outline-none rounded-md"
              >
                <span className="mr-2">
                  {showMoreOptions ? 'Less options' : 'More options'}
                </span>
                {showMoreOptions ? (
                  <ChevronUp className="w-4 h-4 text-museio-purple" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-museio-purple" />
                )}
              </button>

              {/* Optional Fields */}
              {showMoreOptions && (
                <div className="space-y-4 animate-fade-in transition-all duration-300">
                  <div>
                    <Label htmlFor="eventDescription" className="text-gray-700 font-medium">Event Description (optional)</Label>
                    <Textarea
                      id="eventDescription"
                      value={formData.eventDescription}
                      onChange={(e) => setFormData({...formData, eventDescription: e.target.value})}
                      placeholder="Brief description of your event and what you're looking for..."
                      className="bg-white/80 backdrop-blur-lg border border-white/40 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-museio-purple"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="budget" className="text-gray-700 font-medium">Budget (optional)</Label>
                    <Input
                      id="budget"
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({...formData, budget: e.target.value})}
                      placeholder="Your budget for this event"
                      className="bg-white/80 backdrop-blur-lg border border-white/40 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-museio-purple"
                    />
                  </div>
                  <div>
                    <Label htmlFor="message" className="text-gray-700 font-medium">Special Requirements (optional)</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      placeholder="Any special requirements, equipment needs, or additional details..."
                      className="bg-white/80 backdrop-blur-lg border border-white/40 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-museio-purple"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4 p-4 bg-white/80 backdrop-blur-lg rounded-lg border border-white/40 shadow-xl">
              <div className="flex items-center gap-2 text-gray-700">
                <CalendarIcon className="w-4 h-4 text-museio-purple" />
                <span>{formData.selectedDate ? format(formData.selectedDate, 'PPP') : 'No date selected'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-4 h-4 text-museio-purple" />
                <span>
                  {formData.startTime} - {formData.endTime}
                  {formData.endDate && formData.endDate !== formData.selectedDate && (
                    <span className="text-orange-600 ml-2 text-sm">(overnight)</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <User className="w-4 h-4 text-museio-purple" />
                <span>{formData.guestName} ({formData.guestEmail})</span>
              </div>
              {formData.eventName && (
                <div className="flex items-start gap-2 text-gray-700">
                  <span className="w-4 h-4 text-museio-purple mt-0.5">🎉</span>
                  <span>{formData.eventName}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-museio-purple" />
                <span>{formData.location}</span>
              </div>
              {formData.budget && (
                <div className="flex items-center gap-2 text-gray-700">
                  <DollarSign className="w-4 h-4 text-museio-purple" />
                  <span>${formData.budget}</span>
                </div>
              )}
              {formData.contactPhone && (
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="w-4 h-4 text-museio-purple">📞</span>
                  <span>{formData.contactPhone}</span>
                </div>
              )}

              <div className="sr-only" aria-hidden="true">
                <Label htmlFor="companyWebsite">Company website</Label>
                <Input
                  id="companyWebsite"
                  tabIndex={-1}
                  autoComplete="off"
                  value={formData.companyWebsite}
                  onChange={(e) =>
                    setFormData({ ...formData, companyWebsite: e.target.value })
                  }
                />
              </div>

	              {turnstileSiteKey ? (
	                <div className="rounded-xl border border-purple-100 bg-white/90 p-3 shadow-sm">
	                  <div className="mb-2 text-sm font-medium text-gray-700">
	                    Quick verification
	                  </div>
	                  <TurnstileWidget
	                    key={captchaWidgetKey}
	                    siteKey={turnstileSiteKey}
	                    onVerify={(token) => {
	                      setCaptchaToken(token);
                      setCaptchaError(null);
                      setSubmitError(null);
                    }}
                    onExpire={() => {
                      setCaptchaToken('');
                      setCaptchaError('Verification expired. Please complete it again.');
                    }}
	                    onError={(message) => {
	                      setCaptchaToken('');
	                      setCaptchaError(message);
	                    }}
	                  />
	                  {captchaError && (
	                    <div className="mt-2 space-y-3">
	                      <p className="text-sm text-red-600">{captchaError}</p>
	                      <Button
	                        type="button"
	                        variant="outline"
	                        className="border-purple-200 text-purple-700 hover:bg-purple-50"
	                        onClick={() => {
	                          setCaptchaToken('');
	                          setCaptchaError(null);
	                          setSubmitError(null);
	                          setCaptchaWidgetKey((current) => current + 1);
	                        }}
	                      >
	                        Retry verification
	                      </Button>
	                    </div>
	                  )}
	                </div>
	              ) : null}
            </div>
        );

      default:
        return null;
    }
	  };

	  const showStepTile = viewMode !== 'confirmation' && currentStep !== 5;

	  const stepSurfaceClass =
	    'rounded-[36px] border border-white/50 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,245,255,0.96))] p-4 shadow-[0_28px_80px_rgba(15,23,42,0.2)] backdrop-blur-xl sm:p-6 lg:p-8';

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.selectedDate !== null;
      case 2: return formData.startTime !== '' && formData.endTime !== '';
      case 3: return formData.guestName.trim() !== '' && formData.guestEmail.trim() !== '';
      case 4: return formData.location.trim() !== '' && formData.eventName.trim() !== '';
      case 5: return !turnstileSiteKey || captchaToken !== '';
      default: return false;
    }
  };


  if (loading) {
    return (
      <div className={variant === 'modal' ? 'p-6 text-center' : 'min-h-screen bg-[linear-gradient(to_top_right,#C593F2,#8B7BD8,#8B5CF6)] flex items-center justify-center'}>
        <div className="text-center text-purple-800">Loading...</div>
      </div>
    );
  }

  if (!artist) {
    if (variant === 'modal') {
      return <div className="p-6 text-center text-red-600">Artist not found</div>;
    }
    return <Navigate to="/404" replace />;
  }

  if (submitted) {
    const successContent = (
      <Card className="max-w-[350px] mx-auto p-8 text-center bg-white/90 backdrop-blur-lg border border-white/40 shadow-2xl transform hover:scale-105 transition-all duration-300">
        <div className="mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg transform transition-transform duration-300">
            <span className="text-white text-2xl">✓</span>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Booking Request Sent!</h2>
          <p className="text-gray-600">
            Your booking request has been sent to {artist.nickname}. They will get back to you soon!
          </p>
        </div>
        {variant === 'modal' && onClose && (
          <Button onClick={onClose} className="mt-4">
            Close
          </Button>
        )}
      </Card>
    );

    if (variant === 'modal') {
      return <div className="p-4">{successContent}</div>;
    }

    return (
      <div className="min-h-screen bg-[linear-gradient(to_top_right,#C593F2,#8B7BD8,#8B5CF6)] flex items-center justify-center p-4">
        {successContent}
      </div>
    );
  }

  const bookingContent = (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h1 
          className="text-4xl font-bold mb-2 drop-shadow-2xl"
          style={
            { color: 'black' }
          }
        >
          {artist?.nickname}
        </h1>
      </div>
      
	      {showStepTile ? (
	        <div className={stepSurfaceClass}>
	          {renderStepContent()}

	          <div className="mt-8 flex items-center justify-between">
	            {currentStep > 1 ? (
	              <Button
	                variant="ghost"
	                onClick={handleBack}
	                className="text-purple-800 hover:bg-[#F5F0FF] border border-[#D9CFFD] bg-white/80 transition-all duration-300"
	              >
	                <ArrowLeft className="w-4 h-4 mr-2" />
	                Back
	              </Button>
	            ) : (
	              <div />
	            )}

	            <Button
	              onClick={handleNext}
	              disabled={!canProceed()}
	              className="bg-gradient-to-r from-museio-purple to-purple-600 hover:from-purple-700 hover:to-purple-800 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
	            >
	              Next
	              <ArrowRight className="w-4 h-4 ml-2" />
	            </Button>
	          </div>
	        </div>
	      ) : (
	        renderStepContent()
	      )}

	      {viewMode === 'confirmation' && submitError && (
	        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
	          {submitError}
	        </div>
	      )}
	      
	      {!showStepTile && (
	      <div className="mt-6 flex justify-between items-center">
	        {currentStep > 1 && (
	          <Button
	            variant="ghost"
            onClick={handleBack}
            className="text-purple-800 hover:bg-white/30 backdrop-blur-lg border border-white/40 transform hover:scale-105 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        
        {currentStep === 1 && <div></div>}

        {viewMode === 'confirmation' ? (
          <Button
            onClick={handleSubmitBooking}
            disabled={!canProceed() || submitting}
            className="bg-gradient-to-r from-museio-purple to-purple-600 hover:from-purple-700 hover:to-purple-800 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
          >
            {submitting ? 'Sending...' : 'Send Request'}
          </Button>
	        ) : (
	          <Button
	            onClick={handleNext}
            disabled={!canProceed()}
            className="bg-gradient-to-r from-museio-purple to-purple-600 hover:from-purple-700 hover:to-purple-800 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            Next
	            <ArrowRight className="w-4 h-4 ml-2" />
	          </Button>
	        )}
	      </div>
	      )}
	    </div>
	  );

  if (variant === 'modal') {
    return bookingContent;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(to_top_right,#C593F2,#8B7BD8,#8B5CF6)]">
      {bookingContent}
      
      <div className="text-center mt-8 pb-4">
        <p className="text-white/60 text-xs">
          Powered by MuseioApp.com
        </p>
        <p className="text-white/60 text-xs">
          All rights reserved © 2025 MUSEIO
        </p>
      </div>
    </div>
  );
};

export default BookingPage;
