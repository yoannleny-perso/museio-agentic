import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar as CalendarIcon,
  MapPin,
  ExternalLink,
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar'; // shadcn/react-day-picker wrapper
import CarouselDots from '@/components/ui/carousel-dots';
import { format } from 'date-fns';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';
import { useModedPortfolioData } from '@/context/PortfolioDataContextModed';
import Image from '@/components/ui/image';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { truncateText } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from '@/components/ui/carousel';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  dateOnlyFromDate,
  normalizeDateOnlyString,
  parseDateOnlyString,
} from '@/contracts';

interface NextShowCarouselProps {
  onAddContent?: (triggerFn: () => void) => void;
  sectionKey?: string;
  onNavigationReady?: (navigation: {
    onNavigatePrev: () => void;
    onNavigateNext: () => void;
    canNavigatePrev: boolean;
    canNavigateNext: boolean;
  }) => void;
  isEditMode?: boolean;
}

const NextShowCarousel: React.FC<NextShowCarouselProps> = ({
  onAddContent,
  sectionKey,
  onNavigationReady,
  isEditMode
}) => {
  const { events, eventsLoading, createEvent, updateEvent, deleteEvent } = useModedPortfolioData();
  const { themeColors, isDarkTheme } = usePortfolioTheme();
  const { profile } = useUserProfile();

  const [isCreating, setIsCreating] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    event_name: '',
    event_date: '',
    venue: '',
    location: '',
    ticket_url: '',
    flyer_image_url: '',
    is_enabled: true
  });

  // Filter for active and upcoming events
  const today = dateOnlyFromDate(new Date());
  const activeEvents = events.filter((event: any) =>
    event.is_enabled &&
    normalizeDateOnlyString(event.event_date) >= today
  );

  // Group events into pairs for 2 rows per slide (vertical stacking)
  const eventGroups: any[] = [];
  for (let i = 0; i < activeEvents.length; i += 2) {
    eventGroups.push(activeEvents.slice(i, i + 2));
  }

  const handleAddEvent = useCallback(() => {
    if (isEditMode) {
      setIsCreating(true);
      setFormData({
        event_name: '',
        event_date: '',
        venue: '',
        location: '',
        ticket_url: '',
        flyer_image_url: '',
        is_enabled: true
      });
    }
  }, [isEditMode]);

  const handleTicketClick = (ticketUrl: string) => {
    window.open(ticketUrl, '_blank');
  };

  const startEdit = (event: any) => {
    setFormData({
      event_name: event.event_name,
      event_date: normalizeDateOnlyString(event.event_date),
      venue: event.venue || '',
      location: event.location || '',
      ticket_url: event.ticket_url || '',
      flyer_image_url: event.flyer_image_url || '',
      is_enabled: event.is_enabled
    });
    setEditingEvent(event.id);
  };

  // Dynamic themed background per card
  const getCardBackgroundColor = (cardIndex: number) => {
    const variant = cardIndex % 3;
    switch (variant) {
      case 0:
        return themeColors.cardBackgroundPrimary;
      case 1:
        return themeColors.cardBackgroundSecondary;
      default:
        return themeColors.cardBackgroundTertiary;
    }
  };

  // Update navigation state and notify parent when carousel API changes
  useEffect(() => {
    if (!api) return;

    const updateScrollState = () => {
      const canPrev = api.canScrollPrev();
      const canNext = api.canScrollNext();
      const selectedIndex = api.selectedScrollSnap();

      setCanScrollPrev(canPrev);
      setCanScrollNext(canNext);
      setCurrentSlide(selectedIndex);

      if (onNavigationReady) {
        onNavigationReady({
          onNavigatePrev: () => {
            if (api.canScrollPrev()) api.scrollPrev();
          },
          onNavigateNext: () => {
            if (api.canScrollNext()) api.scrollNext();
          },
          canNavigatePrev: canPrev,
          canNavigateNext: canNext,
        });
      }
    };

    updateScrollState();
    api.on('select', updateScrollState);
    api.on('reInit', updateScrollState);

    return () => {
      api.off('select', updateScrollState);
      api.off('reInit', updateScrollState);
    };
  }, [api, onNavigationReady]);

  // Register add event function with parent
  useEffect(() => {
    if (onAddContent) onAddContent(handleAddEvent);
  }, [onAddContent, handleAddEvent]);

  const handleCreateEvent = async () => {
    if (!sectionKey) return;

    const result = await createEvent({
      ...formData,
      event_date: normalizeDateOnlyString(formData.event_date),
      section_id: sectionKey || null,
      display_order: 0
    });

    if (result) {
      setIsCreating(false);
      setFormData({
        event_name: '',
        event_date: '',
        venue: '',
        location: '',
        ticket_url: '',
        flyer_image_url: '',
        is_enabled: true
      });
      toast.success('Event created successfully');
    }
  };

  const handleUpdateEvent = async (id: string) => {
    const result = await updateEvent(id, {
      ...formData,
      event_date: normalizeDateOnlyString(formData.event_date)
    });

    if (result) {
      setEditingEvent(null);
      toast.success('Event updated successfully');
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!profile?.username) {
      toast.error('Profile username is required for image upload');
      return;
    }

    setIsUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `events/${profile.username}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('portfolio-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('portfolio-images')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, flyer_image_url: data.publicUrl }));
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Render individual event card
  const renderEventCard = (event: any, cardIndex: number) => (
    <div
      key={event.id}
      className="rounded-xl p-4 shadow-sm group hover:shadow-md transition-shadow"
      style={{ backgroundColor: getCardBackgroundColor(cardIndex) }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <h4
                  className="font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ color: themeColors.text }}
                >
                  {truncateText(event.event_name, 11)}
                </h4>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                align="start"
                className="max-w-48 break-words whitespace-normal shadow-lg backdrop-blur-sm !bg-opacity-95"
                collisionPadding={8}
                avoidCollisions={true}
                style={{
                  backgroundColor: themeColors.cardBackground,
                  borderColor: themeColors.border,
                  color: themeColors.text
                }}
              >
                <p className="text-sm break-words">{event.event_name}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="space-y-2 text-sm mb-3" style={{ color: themeColors.textSecondary }}>
            <div className="flex items-center">
              {/* Use the icon component, not the date picker */}
              <CalendarIcon className="w-4 h-4 mr-2" />
              {(() => {
                const parsedDate = parseDateOnlyString(event.event_date);
                return parsedDate
                  ? format(parsedDate, 'MMMM d, yyyy')
                  : normalizeDateOnlyString(event.event_date);
              })()}
            </div>

            {event.venue && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                {event.venue}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {event.ticket_url ? (
              <Button
                onClick={() => handleTicketClick(event.ticket_url!)}
                size="sm"
                style={{
                  backgroundColor: 'transparent',
                  color: isDarkTheme() ? 'rgba(255, 255, 255, 0.9)' : themeColors.primary,
                  border: `1px solid ${themeColors.primary}`
                }}
                className="hover:opacity-80 transition-opacity text-xs px-1.5 py-0.5"
              >
                <ExternalLink className="w-2 h-2 mr-0.5" />
                Tickets
              </Button>
            ) : (
              <>
               
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {isEditMode && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => startEdit(event)}
                className="p-1 rounded transition-colors"
                style={{ color: themeColors.textSecondary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = themeColors.primary;
                  e.currentTarget.style.backgroundColor = `${themeColors.primary}10`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = themeColors.textSecondary;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => deleteEvent(event.id)}
                className="p-1 rounded transition-colors"
                style={{ color: themeColors.textSecondary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = themeColors.dangerColor;
                  e.currentTarget.style.backgroundColor = `${themeColors.dangerColor}10`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = themeColors.textSecondary;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
          {event.flyer_image_url ? (
            <div className="relative">
              <Image
                src={event.flyer_image_url}
                alt={event.event_name}
                className="w-20 h-20 object-cover rounded-lg shadow-sm"
                fallbackSrc="/placeholder.svg"
              />
            </div>
          ) : (
            isEditMode && (
              <div
                className="w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center"
                style={{
                  borderColor: themeColors.border,
                  backgroundColor: `${themeColors.textSecondary}10`
                }}
              >
                <ImageIcon
                  className="w-8 h-8"
                  style={{ color: themeColors.textSecondary }}
                />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );

  if (eventsLoading) {
    return (
      <div className="space-y-3">
        <div
          className="h-20 rounded-xl animate-pulse"
          style={{ backgroundColor: `${themeColors.textSecondary}20` }}
        />
        <div
          className="h-20 rounded-xl animate-pulse"
          style={{ backgroundColor: `${themeColors.textSecondary}20` }}
        />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div>
        {/* Inline Form for Creating/Editing Events */}
        {isEditMode && (isCreating || editingEvent) && (
          <div
            className="border rounded-xl p-4 mb-4 shadow-sm"
            style={{
              backgroundColor: themeColors.background,
              borderColor: themeColors.border
            }}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Event name"
                  value={formData.event_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, event_name: e.target.value }))}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 placeholder:text-gray-400"
                  style={{
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                    color: themeColors.text,
                  }}
                />

                <input
                  type="text"
                  placeholder="Venue"
                  value={formData.venue}
                  onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 placeholder:text-gray-400"
                  style={{
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                    color: themeColors.text
                  }}
                />

                {/* Date picker (Popover + Calendar) */}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full p-2 border rounded-lg flex items-center justify-between"
                      style={{
                        backgroundColor: themeColors.background,
                        borderColor: themeColors.border,
                        color: themeColors.text,
                      }}
                    >
                    <span
                            className={
                              formData.event_date
                                ? ""                       // use normal text color when date is selected
                                : "text-gray-400"          // placeholder color when empty
                            }
                          >
                            {formData.event_date
                              ? (() => {
                                  const parsedDate = parseDateOnlyString(formData.event_date);
                                  return parsedDate ? format(parsedDate, "PPP") : formData.event_date;
                                })()
                              : "Pick a date"}
                          </span>
                      <CalendarIcon className="w-4 h-4" />
                    </button>
                  </PopoverTrigger>

                  <PopoverContent
                    className="p-0 z-50"
                    align="start"
                    side="bottom"
                  >
                    <Calendar
                      mode="single"
                      selected={parseDateOnlyString(formData.event_date) || undefined}
                      onSelect={(d) => {
                        if (!d) return;
                        const ymd = dateOnlyFromDate(d);
                        setFormData(p => ({ ...p, event_date: ymd }));
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <input
                  type="text"
                  placeholder="Location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 placeholder:text-gray-400"
                  style={{
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                    color: themeColors.text
                  }}
                />
              </div>

              <input
                type="url"
                placeholder="Ticket URL (optional)"
                value={formData.ticket_url}
                onChange={(e) => setFormData(prev => ({ ...prev, ticket_url: e.target.value }))}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                  color: themeColors.text
                }}
              />

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-medium" style={{ color: themeColors.text }}>
                  Event Flyer (optional)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="flyer-upload"
                    disabled={isUploadingImage}
                  />
                  <label
                    htmlFor="flyer-upload"
                    className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                      color: themeColors.text
                    }}
                  >
                    <Upload className="w-4 h-4" />
                    {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                  </label>
                  {formData.flyer_image_url && (
                    <div className="relative">
                      <img
                        src={formData.flyer_image_url}
                        alt="Event flyer preview"
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, flyer_image_url: '' }))}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={isCreating ? handleCreateEvent : () => handleUpdateEvent(editingEvent!)}
                  disabled={!formData.event_name || !formData.event_date || isUploadingImage}
                  className="px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ backgroundColor: themeColors.primary }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = themeColors.buttonHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = themeColors.primary)}
                >
                  {isCreating ? 'Create Event' : 'Update Event'}
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setEditingEvent(null);
                  }}
                  className="px-4 py-2 rounded-lg transition-colors"
                  style={{
                    backgroundColor: themeColors.background,
                    color: themeColors.textSecondary,
                    border: `1px solid ${themeColors.border}`
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {activeEvents.length === 0 && !isCreating && !editingEvent ? (
          <div className="text-center py-12">
            <div
              className="rounded-lg p-8 max-w-md mx-auto border-2 border-dashed transition-colors"
              style={{
                backgroundColor: themeColors.cardBackground,
                borderColor: themeColors.border,
                color: themeColors.text
              }}
            >
              <CalendarIcon
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: themeColors.textSecondary }}
              />
              <h3
                className="text-lg font-medium mb-4"
                style={{ color: themeColors.sectionTitleColor }}
              >
                No Upcoming Events Yet
              </h3>
              <Button
                onClick={handleAddEvent}
                className="font-medium transition-all hover:scale-105"
                style={{
                  backgroundColor: themeColors.primary,
                  color: '#FFFFFF',
                  borderColor: themeColors.primary
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = themeColors.buttonHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = themeColors.primary;
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Event
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Carousel
              setApi={setApi}
              opts={{
                align: 'start',
                loop: false,
                containScroll: 'trimSnaps',
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {eventGroups.map((group, groupIndex) => (
                  <CarouselItem key={groupIndex} className="pl-4 basis-full">
                    <div className="grid grid-cols-1 gap-4">
                      {group.map((event: any, eventIndex: number) =>
                        renderEventCard(event, groupIndex * 2 + eventIndex)
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
            <CarouselDots
              totalSlides={eventGroups.length}
              currentSlide={currentSlide}
              onSlideSelect={(index) => api?.scrollTo(index)}
            />
          </>
        )}
      </div>
    </TooltipProvider>
  );
};

export default NextShowCarousel;
