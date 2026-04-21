import React, { createContext, useContext, useMemo, useCallback } from 'react';
import {
  PortfolioDataContext,
  PortfolioDataProvider as WorkingDataProvider,
  usePortfolioData as useWorkingData,
} from '@/context/PortfolioDataContext';
import { UsernamePortfolioDataProvider, useUsernamePortfolioData } from '@/context/UsernamePortfolioDataContext';
import { usePortfolioMode } from '@/context/PortfolioModeContext';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserProfile } from '@/hooks/useUserProfile';
import { ProfileData } from '@/types';

// Enhanced interfaces for unified context
interface UserProfile {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface PortfolioData {
  artist_name: string | null;
  bio_short: string | null;
  bio_full: string | null;
  background_gradient: string | null;
  theme_colors: Record<string, unknown> | null;
  layout_preferences: Record<string, unknown> | null;
  social_links: Record<string, unknown> | null;
  section_order: Record<string, unknown> | null;
  enabled_sections: Record<string, unknown> | null;
  section_titles: Record<string, unknown> | null;
  section_configs: Record<string, unknown> | null;
  is_public?: boolean | null;
  is_live?: boolean | null;
  profile_image_url?: string | null;
}
interface PortfolioPhoto {
  id: string;
  image_url: string;
  caption: string | null;
  section_id: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface PortfolioVideo {
  id: string;
  video_url: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  section_id: string | null;
  display_order: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface FeaturedCard {
  id: string;
  user_id: string;
  title: string;
  subtitle?: string;
  button_text: string;
  button_link?: string;
  background_image_url?: string;
  background_color: string;
  icon_url?: string;
  section_id: string | null;
  display_order: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface MusicRelease {
  id: string;
  user_id: string;
  title: string;
  artist_name?: string;
  cover_image_url?: string;
  release_date?: string;
  spotify_link?: string;
  apple_music_link?: string;
  youtube_link?: string;
  soundcloud_link?: string;
  beatport_link?: string;
  section_id: string | null;
  display_order: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface PortfolioEvent {
  id: string;
  event_name: string;
  event_date: string;
  venue: string;
  location: string | null;
  ticket_url: string | null;
  flyer_image_url: string | null;
  section_id: string | null;
  is_enabled: boolean | null;
  display_order: number | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface UnifiedPortfolioContextType {
  // Core data from base contexts
  data: PortfolioData | null;
  loading: boolean;
  saving: boolean;
  updateData: (updates: Partial<PortfolioData>) => Promise<boolean>;
  refetch: () => Promise<void>;
  userProfile: UserProfile | ProfileData | null;

  // Photos - Complete CRUD operations
  photos: PortfolioPhoto[];
  photosLoading: boolean;
  uploadPhotos: (files: File[], sectionId?: string) => Promise<void>;
  deletePhoto: (photoId: string) => Promise<void>;
  updatePhotoOrder: (photoIdOrUpdates: string | Array<{id: string, newOrder: number}>, newOrder?: number) => Promise<boolean>;
  refetchPhotos: () => Promise<void>;

  // Videos - Complete CRUD operations  
  videos: PortfolioVideo[];
  videosLoading: boolean;
  deleteVideo: (videoId: string) => Promise<void>;
  updateVideoOrder: (videoId: string, newOrder: number) => Promise<void>;
  refetchVideos: () => Promise<void>;
  getEmbedUrl: (videoUrl: string) => string | null;

  // Featured Cards - Complete CRUD operations
  featuredCards: FeaturedCard[];
  featuredCardsLoading: boolean;
  createFeaturedCard: (cardData: Omit<FeaturedCard, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<FeaturedCard | null>;
  updateFeaturedCard: (id: string, updates: Partial<FeaturedCard>) => Promise<boolean>;
  deleteFeaturedCard: (id: string) => Promise<boolean>;
  refetchFeaturedCards: () => Promise<void>;

  // Music Releases - Complete CRUD operations
  musicReleases: MusicRelease[];
  musicReleasesLoading: boolean;
  createMusicRelease: (releaseData: Omit<MusicRelease, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<MusicRelease | null>;
  updateMusicRelease: (id: string, updates: Partial<MusicRelease>) => Promise<boolean>;
  deleteMusicRelease: (id: string) => Promise<boolean>;
  refetchMusicReleases: () => Promise<void>;

  // Events - Complete CRUD operations
  events: PortfolioEvent[];
  eventsLoading: boolean;
  createEvent: (eventData: Omit<PortfolioEvent, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<PortfolioEvent | null>;
  updateEvent: (id: string, updates: Partial<PortfolioEvent>) => Promise<boolean>;
  deleteEvent: (id: string) => Promise<boolean>;
  refetchEvents: () => Promise<void>;
}

const UnifiedPortfolioContext = createContext<UnifiedPortfolioContextType | undefined>(undefined);

// Unified data provider that includes all CRUD operations
export const ModedPortfolioDataProvider: React.FC<{ 
  children: React.ReactNode; 
  username?: string;
}> = ({ children, username }) => {
  const existingWorkingContext = useContext(PortfolioDataContext);

  // If username is provided, use the username-based provider (for live mode)
  if (username) {
    return (
      <UsernamePortfolioDataProvider username={username}>
        <UnifiedContextWrapper>{children}</UnifiedContextWrapper>
      </UsernamePortfolioDataProvider>
    );
  }
  
  // Reuse the route-level working provider when it already exists to avoid
  // duplicate fetches and nested authenticated portfolio state.
  if (existingWorkingContext) {
    return <UnifiedContextWrapper>{children}</UnifiedContextWrapper>;
  }

  // Fallback for standalone edit-mode mounts that do not already have one.
  return (
    <WorkingDataProvider>
      <UnifiedContextWrapper>{children}</UnifiedContextWrapper>
    </WorkingDataProvider>
  );
};

// Wrapper for live mode (with username context)
const LiveModeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { mode } = usePortfolioMode();
  const { profile } = useUserProfile();
  const baseContext = useUsernamePortfolioData();
  
  return <ContextProvider baseContext={baseContext} user={user} mode={mode} profile={profile}>{children}</ContextProvider>;
};

// Wrapper for edit mode (with working data context)
const EditModeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { mode } = usePortfolioMode();
  const { profile } = useUserProfile();
  const baseContext = useWorkingData();
  
  return <ContextProvider baseContext={baseContext} user={user} mode={mode} profile={profile}>{children}</ContextProvider>;
};

// Wrapper that adds additional operations to the base context
const UnifiedContextWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { mode } = usePortfolioMode();
  
  // Use the appropriate wrapper based on mode
  if (mode === 'live') {
    return <LiveModeWrapper>{children}</LiveModeWrapper>;
  } else {
    return <EditModeWrapper>{children}</EditModeWrapper>;
  }
};

// The actual context provider logic
const ContextProvider: React.FC<{ 
  children: React.ReactNode;
  baseContext: any;
  user: any;
  mode: string;
  profile: UserProfile | null;
}> = ({ children, baseContext, user, mode, profile }) => {
  
  // Memoized photo operations
  const uploadPhotos = useCallback(async (files: File[], sectionId?: string) => {
    if (mode !== 'edit' || !user) {
      toast.error('Upload not available in live mode');
      return;
    }

    try {
      // Validate file sizes (10MB limit)
      const maxSize = 10 * 1024 * 1024;
      const oversizedFiles = files.filter(file => file.size > maxSize);
      if (oversizedFiles.length > 0) {
        const fileNames = oversizedFiles.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(1)}MB)`).join(', ');
        throw new Error(`Files exceed 10MB limit: ${fileNames}`);
      }

      // Get the highest display order
      const { data: existingPhotos } = await supabase
        .from('portfolio_photos')
        .select('display_order')
        .eq('user_id', user.id)
        .order('display_order', { ascending: false })
        .limit(1);

      let nextOrder = existingPhotos && existingPhotos.length > 0 
        ? (existingPhotos[0].display_order || 0) + 1 
        : 1;

      const uploadPromises = files.map(async (file) => {
        // Upload to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('portfolio-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('portfolio-images')
          .getPublicUrl(fileName);

        // Insert into database
        const { data: insertedPhoto, error: dbError } = await supabase
          .from('portfolio_photos')
          .insert({
            user_id: user.id,
            image_url: publicUrl,
            section_id: sectionId || null,
            display_order: nextOrder++,
            username: profile?.username || null
          })
          .select()
          .single();

        if (dbError) throw dbError;
        return insertedPhoto;
      });

      await Promise.all(uploadPromises);
      
      // Refresh photos
      await baseContext.refetchPhotos();
      
      toast.success(`${files.length} photo(s) uploaded successfully!`);
    } catch (error: unknown) {
      console.error('Error uploading photos:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload photos';
      toast.error(errorMessage);
    }
  }, [mode, user, profile, baseContext]);

  const updatePhotoOrder = useCallback(async (photoIdOrUpdates: string | Array<{id: string, newOrder: number}>, newOrder?: number): Promise<boolean> => {
    if (mode !== 'edit') {
      return false;
    }
    
    if (!user) {
      return false;
    }
    
    try {
      // Handle batch updates
      if (Array.isArray(photoIdOrUpdates)) {
        const updates = photoIdOrUpdates;
        const photoIds = updates.map((update) => update.id);

        const { data: currentPhotos, error: currentPhotosError } = await supabase
          .from('portfolio_photos')
          .select('id, display_order')
          .in('id', photoIds)
          .eq('user_id', user.id);

        if (currentPhotosError) {
          throw currentPhotosError;
        }

        if (!currentPhotos || currentPhotos.length !== updates.length) {
          throw new Error('Could not load the current photo order for all reordered photos');
        }

        const currentOrderMap = new Map(
          currentPhotos.map((photo) => [photo.id, photo.display_order])
        );

        const currentOrderSlots = updates
          .map((update) => currentOrderMap.get(update.id))
          .filter((order): order is number => typeof order === 'number' && Number.isFinite(order) && order > 0);

        const hasReusableOrderSlots =
          currentOrderSlots.length === updates.length &&
          new Set(currentOrderSlots).size === updates.length;

        const targetOrders = hasReusableOrderSlots
          ? [...currentOrderSlots].sort((a, b) => a - b)
          : [];

        if (!hasReusableOrderSlots) {
          const { data: allPhotos, error: allPhotosError } = await supabase
            .from('portfolio_photos')
            .select('id, display_order')
            .eq('user_id', user.id);

          if (allPhotosError) {
            throw allPhotosError;
          }

          const usedOrders = new Set(
            (allPhotos ?? [])
              .filter((photo) => !photoIds.includes(photo.id))
              .map((photo) => photo.display_order)
              .filter((order): order is number => typeof order === 'number' && Number.isFinite(order) && order > 0)
          );

          let candidate = 1;
          while (targetOrders.length < updates.length) {
            if (!usedOrders.has(candidate)) {
              targetOrders.push(candidate);
            }
            candidate += 1;
          }
        }
        
        // Phase 1: Set all to temporary negative values to avoid constraint violations
        await Promise.all(
          updates.map(async (update, index) => {
            const tempOrder = -(index + 1000);
            const { error } = await supabase
              .from('portfolio_photos')
              .update({ display_order: tempOrder })
              .eq('id', update.id)
              .eq('user_id', user.id);

            if (error) {
              throw error;
            }
          })
        );
        
        // Phase 2: Set to final values
        await Promise.all(
          updates.map(async (update, index) => {
            const { error } = await supabase
              .from('portfolio_photos')
              .update({ display_order: targetOrders[index] })
              .eq('id', update.id)
              .eq('user_id', user.id);

            if (error) {
              throw error;
            }
          })
        );

        await baseContext.refetchPhotos();
        return true;
      }
      
      // Handle single update
      const photoId = photoIdOrUpdates as string;
      if (!newOrder) {
        throw new Error('newOrder is required for single photo update');
      }

      // First check if the photo exists and belongs to the user
      const { data: photo, error: fetchError } = await supabase
        .from('portfolio_photos')
        .select('id, user_id, display_order')
        .eq('id', photoId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !photo) {
        throw new Error(`Photo not found or access denied: ${fetchError?.message || 'Unknown error'}`);
      }

      // Now update the display order
      const { error } = await supabase
        .from('portfolio_photos')
        .update({ display_order: newOrder })
        .eq('id', photoId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      await baseContext.refetchPhotos();
      return true;
    } catch (error: unknown) {
      console.error('Error updating photo order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to update photo order: ${errorMessage}`);
      return false;
    }
  }, [mode, user, baseContext]);

  // Memoized video operations
  const getEmbedUrl = useCallback((videoUrl: string): string | null => {
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/;
    const vimeoRegex = /(?:vimeo\.com\/)([0-9]+)/;
    
    const youtubeMatch = videoUrl.match(youtubeRegex);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1&rel=0`;
    }
    
    const vimeoMatch = videoUrl.match(vimeoRegex);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }
    
    return null;
  }, []);

  // Memoized music release operations
  const createMusicRelease = useCallback(async (releaseData: Omit<MusicRelease, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<MusicRelease | null> => {
    if (mode !== 'edit' || !user) return null;

    try {
      const { data, error } = await supabase
        .from('portfolio_music_releases')
        .insert({
          ...releaseData,
          user_id: user.id,
          username: profile?.username || null
        })
        .select()
        .single();

      if (error) throw error;

      await baseContext.refetchMusicReleases();
      toast.success('Music release created successfully');
      return data;
    } catch (error) {
      console.error('Error creating music release:', error);
      toast.error('Failed to create music release');
      return null;
    }
  }, [mode, user, profile, baseContext]);

  const updateMusicRelease = useCallback(async (id: string, updates: Partial<MusicRelease>): Promise<boolean> => {
    if (mode !== 'edit') return false;
    
    try {
      const { error } = await supabase
        .from('portfolio_music_releases')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await baseContext.refetchMusicReleases();
      toast.success('Music release updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating music release:', error);
      toast.error('Failed to update music release');
      return false;
    }
  }, [mode, baseContext]);

  const deleteMusicRelease = useCallback(async (id: string): Promise<boolean> => {
    if (mode !== 'edit') return false;
    
    try {
      const { error } = await supabase
        .from('portfolio_music_releases')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await baseContext.refetchMusicReleases();
      toast.success('Music release deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting music release:', error);
      toast.error('Failed to delete music release');
      return false;
    }
  }, [mode, baseContext]);

  // Memoized event operations
  const createEvent = useCallback(async (eventData: Omit<PortfolioEvent, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<PortfolioEvent | null> => {
    if (mode !== 'edit' || !user) return null;

    try {
      const { data, error } = await supabase
        .from('portfolio_events')
        .insert({
          ...eventData,
          user_id: user.id,
          username: profile?.username || null
        })
        .select()
        .single();

      if (error) throw error;

      await baseContext.refetchEvents();
      toast.success('Event created successfully');
      return data;
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
      return null;
    }
  }, [mode, user, profile, baseContext]);

  const updateEvent = useCallback(async (id: string, updates: Partial<PortfolioEvent>): Promise<boolean> => {
    if (mode !== 'edit') return false;
    
    try {
      const { error } = await supabase
        .from('portfolio_events')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await baseContext.refetchEvents();
      toast.success('Event updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
      return false;
    }
  }, [mode, baseContext]);

  const deleteEvent = useCallback(async (id: string): Promise<boolean> => {
    if (mode !== 'edit') return false;
    
    try {
      const { error } = await supabase
        .from('portfolio_events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await baseContext.refetchEvents();
      toast.success('Event deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
      return false;
    }
  }, [mode, baseContext]);

  // Memoized context value with stable references
  const contextValue = useMemo(() => ({
    // Core data from base context
    data: baseContext.data,
    loading: baseContext.loading,
    saving: baseContext.saving,
    updateData: baseContext.updateData,
    refetch: baseContext.refetch,
    userProfile: mode === 'edit' ? profile : baseContext.userProfile,

    // Photos with enhanced operations
    photos: baseContext.photos,
    photosLoading: baseContext.photosLoading,
    uploadPhotos,
    deletePhoto: baseContext.deletePhoto,
    updatePhotoOrder,
    refetchPhotos: baseContext.refetchPhotos,

    // Videos with enhanced operations
    videos: baseContext.videos,
    videosLoading: baseContext.videosLoading,
    deleteVideo: baseContext.deleteVideo,
    updateVideoOrder: baseContext.updateVideoOrder,
    refetchVideos: baseContext.refetchVideos,
    getEmbedUrl,

    // Featured Cards
    featuredCards: baseContext.featuredCards,
    featuredCardsLoading: baseContext.featuredCardsLoading,
    createFeaturedCard: baseContext.createFeaturedCard,
    updateFeaturedCard: baseContext.updateFeaturedCard,
    deleteFeaturedCard: baseContext.deleteFeaturedCard,
    refetchFeaturedCards: baseContext.refetchFeaturedCards,

    // Music Releases with enhanced operations
    musicReleases: baseContext.musicReleases,
    musicReleasesLoading: baseContext.musicReleasesLoading,
    createMusicRelease,
    updateMusicRelease,
    deleteMusicRelease,
    refetchMusicReleases: baseContext.refetchMusicReleases,

    // Events with enhanced operations
    events: baseContext.events,
    eventsLoading: baseContext.eventsLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    refetchEvents: baseContext.refetchEvents
  }), [
    baseContext,
    profile,
    uploadPhotos,
    updatePhotoOrder,
    getEmbedUrl,
    createMusicRelease,
    updateMusicRelease,
    deleteMusicRelease,
    createEvent,
    updateEvent,
    deleteEvent
  ]);

  return (
    <UnifiedPortfolioContext.Provider value={contextValue}>
      {children}
    </UnifiedPortfolioContext.Provider>
  );
};

export const useModedPortfolioData = (): UnifiedPortfolioContextType => {
  const context = useContext(UnifiedPortfolioContext);
  if (context === undefined) {
    throw new Error('useModedPortfolioData must be used within a ModedPortfolioDataProvider');
  }
  return context;
};
