import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, ExternalLink, Plus, Edit, Trash2, Image as ImageIcon, Loader2, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';
import { useModedPortfolioData } from '@/context/PortfolioDataContextModed';
import { extractUrlMetadata } from '@/utils/urlMetadata';
import Image from '@/components/ui/image';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { truncateText } from '@/lib/utils';
import {
  dateOnlyFromDate,
  normalizeDateOnlyString,
  parseDateOnlyString,
} from '@/contracts';

interface TicketsSectionProps {
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

const TicketsSection: React.FC<TicketsSectionProps> = ({ onAddContent, sectionKey, onNavigationReady, isEditMode }) => {
  const { events, eventsLoading, createEvent, updateEvent, deleteEvent } = useModedPortfolioData();
  const { themeColors, isDarkTheme } = usePortfolioTheme();
  const [isCreating, setIsCreating] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [isExtractingMetadata, setIsExtractingMetadata] = useState(false);
  const [showManualUpload, setShowManualUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    event_name: '',
    event_date: '',
    ticket_url: '',
    flyer_image_url: '',
    venue: '',
    is_enabled: true
  });

  // Filter for active and upcoming events
  const today = dateOnlyFromDate(new Date());
  const activeEvents = events.filter(event => 
    event.is_enabled && 
    normalizeDateOnlyString(event.event_date) >= today
  );

  const handleCreateEvent = async () => {
    const result = await createEvent({
      ...formData,
      location: '',
      section_id: sectionKey || null,
      display_order: 0
    });
    if (result) {
      setIsCreating(false);
      setShowManualUpload(false);
      setFormData({
        event_name: '',
        event_date: '',
        ticket_url: '',
        flyer_image_url: '',
        venue: '',
        is_enabled: true
      });
    }
  };

  const handleUpdateEvent = async (id: string) => {
    await updateEvent(id, formData);
    setEditingEvent(null);
  };

  const startEdit = (event: any) => {
    setFormData({
      event_name: event.event_name,
      event_date: normalizeDateOnlyString(event.event_date),
      ticket_url: event.ticket_url || '',
      flyer_image_url: event.flyer_image_url || '',
      venue: event.venue || '',
      is_enabled: event.is_enabled
    });
    setShowManualUpload(false);
    setEditingEvent(event.id);
  };

  const handleAddEvent = useCallback(() => {
    // Reset form data for fresh start
    setFormData({
      event_name: '',
      event_date: '',
      ticket_url: '',
      flyer_image_url: '',
      venue: '',
      is_enabled: true
    });
    setShowManualUpload(false);
    setIsExtractingMetadata(false);
    setIsCreating(true);
  }, []);

  const handleTicketClick = (ticketUrl: string) => {
    window.open(ticketUrl, '_blank');
  };

  const handleTicketUrlChange = async (url: string) => {
    setFormData(prev => ({ ...prev, ticket_url: url }));
    setShowManualUpload(false);
    
    // Try to extract metadata from URL if it's valid
    if (url && url.startsWith('http')) {
      setIsExtractingMetadata(true);
      try {
        const metadata = await extractUrlMetadata(url);
        if (metadata) {
          setFormData(prev => ({
            ...prev,
            event_name: metadata.eventName || prev.event_name,
            event_date: metadata.eventDate || prev.event_date,
            flyer_image_url: metadata.image || prev.flyer_image_url
          }));
          
          // Show manual upload if no image was found
          if (!metadata.image) {
            setShowManualUpload(true);
          }
        } else {
          setShowManualUpload(true);
        }
      } catch (error) {
        console.error('Failed to extract metadata:', error);
        setShowManualUpload(true);
      } finally {
        setIsExtractingMetadata(false);
      }
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/events/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('portfolio-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('portfolio-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, flyer_image_url: publicUrl }));
      setShowManualUpload(false);
      toast.success('Event flyer uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload event flyer');
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Get dynamic theme-based background color for cards
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

  // Handle external add content trigger
  useEffect(() => {
    if (onAddContent) {
      onAddContent(handleAddEvent);
    }
  }, [onAddContent, handleAddEvent]);

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
        {(isCreating || editingEvent) && (
        <div 
          className="border rounded-xl p-4 mb-4 shadow-sm"
          style={{
            backgroundColor: themeColors.cardBackground,
            borderColor: themeColors.border
          }}
        >
          <div className="space-y-3">
            {/* Ticket URL field moved to top */}
            <div className="relative">
              <input
                type="url"
                placeholder="Ticket URL"
                value={formData.ticket_url}
                onChange={(e) => handleTicketUrlChange(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: themeColors.inputBackground,
                  borderColor: themeColors.inputBorder,
                  color: themeColors.text,
                  boxShadow: `0 0 0 2px ${themeColors.primary}20`
                }}
              />
              {isExtractingMetadata && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: themeColors.primary }} />
                </div>
              )}
            </div>
            
            {/* Event name, venue and date */}
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Event name"
                value={formData.event_name}
                onChange={(e) => setFormData(prev => ({ ...prev, event_name: e.target.value }))}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: themeColors.inputBackground,
                  borderColor: themeColors.inputBorder,
                  color: themeColors.text,
                  boxShadow: `0 0 0 2px ${themeColors.primary}20`
                }}
              />
              <input
                type="text"
                placeholder="Venue"
                value={formData.venue}
                onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: themeColors.inputBackground,
                  borderColor: themeColors.inputBorder,
                  color: themeColors.text,
                  boxShadow: `0 0 0 2px ${themeColors.primary}20`
                }}
              />
              <input
                type="date"
                placeholder="Event date"
                value={formData.event_date}
                onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: themeColors.inputBackground,
                  borderColor: themeColors.inputBorder,
                  color: themeColors.text,
                  boxShadow: `0 0 0 2px ${themeColors.primary}20`
                }}
              />
            </div>
            
            {/* Manual Upload Section */}
            {showManualUpload && !formData.flyer_image_url && (
              <div className="flex flex-col gap-2">
                <p 
                  className="text-sm" 
                  style={{ color: themeColors.textSecondary }}
                >
                  No image found from URL. Upload event flyer manually:
                </p>
                <button
                  onClick={triggerFileUpload}
                  disabled={isUploading}
                  className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg transition-colors hover:opacity-80"
                  style={{
                    borderColor: themeColors.border,
                    backgroundColor: `${themeColors.primary}10`,
                    color: themeColors.primary
                  }}
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {isUploading ? 'Uploading...' : 'Upload Flyer Image'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="hidden"
                />
              </div>
            )}
            
            {formData.flyer_image_url && (
              <div className="flex justify-center">
                <div 
                  className="border rounded-lg p-2 inline-flex items-center justify-center"
                  style={{ 
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.cardBackground 
                  }}
                >
                  <Image
                    src={formData.flyer_image_url}
                    alt="Event flyer preview"
                    className="w-20 h-20 object-cover rounded"
                    fallbackSrc="/placeholder.svg"
                  />
                </div>
              </div>
            )}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_enabled: e.target.checked }))}
                  className="rounded border-gray-300 text-[#8B5CF6] focus:ring-[#8B5CF6]"
                />
                <span className="text-sm text-gray-700">Active event</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={isCreating ? handleCreateEvent : () => handleUpdateEvent(editingEvent!)}
                disabled={!formData.event_name || !formData.event_date || !formData.venue}
                className="px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                style={{
                  backgroundColor: themeColors.primary,
                  color: '#FFFFFF'
                }}
              >
                {isCreating ? 'Create' : 'Update'}
              </button>
              <button
                onClick={() => {
                  // Reset form data when canceling
                  setFormData({
                    event_name: '',
                    event_date: '',
                    ticket_url: '',
                    flyer_image_url: '',
                    venue: '',
                    is_enabled: true
                  });
                  setIsCreating(false);
                  setEditingEvent(null);
                  setShowManualUpload(false);
                  setIsExtractingMetadata(false);
                }}
                className="px-4 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: `${themeColors.textSecondary}20`,
                  color: themeColors.text
                }}
              >
                Cancel
              </button>
            </div>
            
            {/* Popup message below buttons */}
            <div className="text-center mt-2">
              <p 
                className="text-sm" 
                style={{ color: themeColors.textSecondary }}
              >
                Make sure date and name are correct
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {activeEvents.length === 0 ? (
          <div className="text-center py-12">
            <div 
              className="rounded-lg p-8 max-w-md mx-auto border-2 border-dashed transition-colors"
              style={{
                backgroundColor: themeColors.cardBackground,
                borderColor: themeColors.border,
                color: themeColors.text
              }}
            >
              <Calendar 
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
          activeEvents.map((event) => (
            <div
              key={event.id}
               className="rounded-xl p-4 shadow-sm group hover:shadow-md transition-shadow h-40"
               style={{
                 backgroundColor: getCardBackgroundColor(activeEvents.indexOf(event))
               }}
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
                      <Calendar className="w-4 h-4 mr-2" />
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
                         <ExternalLink className="w-2 h-2 mr-0.25" />
                         Tickets
                       </Button>
                    ) : (
                      <Button variant="outline" disabled size="sm">
                        More Info Coming Soon
                      </Button>
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
          ))
        )}
      </div>
      </div>
    </TooltipProvider>
  );
};

export default TicketsSection;
