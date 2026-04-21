
import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Import interfaces from the existing context
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

interface SmartLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  thumbnail_url?: string;
  icon_url?: string;
  badge_text?: string;
  badge_color?: string;
  is_featured: boolean;
  is_visible: boolean;
  display_order: number;
  click_count: number;
  custom_styling?: any;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface PortfolioData {
  artist_name: string | null;
  bio_short: string | null;
  bio_full: string | null;
  background_gradient: string | null;
  theme_colors: any;
  layout_preferences: any;
  social_links: any;
  section_order: any;
  enabled_sections: any;
  section_titles: any;
  section_configs: any;
  is_public?: boolean | null;
  is_live?: boolean | null;
  profile_image_url?: string | null;
}

interface UsernamePortfolioDataContextType {
  // Core settings
  data: PortfolioData | null;
  loading: boolean;
  saving: boolean;
  updateData: (updates: Partial<PortfolioData>) => Promise<boolean>;
  refetch: () => Promise<void>;

  // Photos
  photos: PortfolioPhoto[];
  photosLoading: boolean;
  deletePhoto: (photoId: string) => Promise<void>;
  refetchPhotos: () => Promise<void>;

  // Videos
  videos: PortfolioVideo[];
  videosLoading: boolean;
  deleteVideo: (videoId: string) => Promise<void>;
  updateVideoOrder: (videoId: string, newOrder: number) => Promise<void>;
  refetchVideos: () => Promise<void>;
  getEmbedUrl: (videoUrl: string) => string | null;

  // Featured Cards
  featuredCards: FeaturedCard[];
  featuredCardsLoading: boolean;
  createFeaturedCard: (cardData: Omit<FeaturedCard, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<FeaturedCard | null>;
  updateFeaturedCard: (id: string, updates: Partial<FeaturedCard>) => Promise<boolean>;
  deleteFeaturedCard: (id: string) => Promise<boolean>;
  refetchFeaturedCards: () => Promise<void>;

  // Music Releases
  musicReleases: MusicRelease[];
  musicReleasesLoading: boolean;
  createMusicRelease: (releaseData: Omit<MusicRelease, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<MusicRelease | null>;
  updateMusicRelease: (id: string, updates: Partial<MusicRelease>) => Promise<boolean>;
  deleteMusicRelease: (id: string) => Promise<boolean>;
  refetchMusicReleases: () => Promise<void>;

  // Events
  events: PortfolioEvent[];
  eventsLoading: boolean;
  createEvent: (eventData: Omit<PortfolioEvent, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<PortfolioEvent | null>;
  updateEvent: (id: string, updates: Partial<PortfolioEvent>) => Promise<boolean>;
  deleteEvent: (id: string) => Promise<boolean>;
  refetchEvents: () => Promise<void>;

  // Smart Links
  smartLinks: SmartLink[];
  smartLinksLoading: boolean;
  createSmartLink: (linkData: Partial<SmartLink>) => Promise<SmartLink | null>;
  updateSmartLink: (id: string, linkData: Partial<SmartLink>) => Promise<SmartLink | null>;
  deleteSmartLink: (id: string) => Promise<void>;
  incrementClickCount: (id: string) => Promise<void>;
  refetchSmartLinks: () => Promise<void>;

  // Username-specific
  portfolioUserId: string | null;
  userProfile: any;
}

const UsernamePortfolioDataContext = createContext<UsernamePortfolioDataContextType | undefined>(undefined);

export const UsernamePortfolioDataProvider: React.FC<{ 
  children: React.ReactNode; 
  username: string;
}> = ({ children, username }) => {
  // Core settings state
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [portfolioUserId, setPortfolioUserId] = useState<string | null>(null);

  // Content states
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  
  const [videos, setVideos] = useState<PortfolioVideo[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);
  
  const [featuredCards, setFeaturedCards] = useState<FeaturedCard[]>([]);
  const [featuredCardsLoading, setFeaturedCardsLoading] = useState(true);
  
  const [musicReleases, setMusicReleases] = useState<MusicRelease[]>([]);
  const [musicReleasesLoading, setMusicReleasesLoading] = useState(true);
  
  const [events, setEvents] = useState<PortfolioEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  
  const [smartLinks, setSmartLinks] = useState<SmartLink[]>([]);
  const [smartLinksLoading, setSmartLinksLoading] = useState(true);

  // Track ongoing requests to prevent duplicates
  const fetchPromiseRef = useRef<Promise<void> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Removed fetchUserProfile to avoid profiles access in live mode

  // Core settings fetch with header photo - using user_id lookup via RPC
  const fetchData = useCallback(async () => {
    if (!username) {
      setLoading(false);
      setData(null);
      setPortfolioUserId(null);
      return;
    }

    // If there's already a fetch in progress, return the existing promise
    if (fetchPromiseRef.current) {
      return fetchPromiseRef.current;
    }

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    const fetchPromise = (async () => {
      try {
        setLoading(true);
        
        // Step 1: Get user_id from username using secure RPC function
        const { data: userId, error: userIdError } = await supabase
          .rpc('get_user_id_by_username', { lookup_username: username });

        if (userIdError || !userId) {
          console.log('User not found for username:', username);
          setData(null);
          setUserProfile(null);
          setPortfolioUserId(null);
          setLoading(false);
          fetchPromiseRef.current = null;
          return;
        }

        // Store the user_id for other fetches
        setPortfolioUserId(userId);
        setUserProfile({ id: userId, username });

        // Step 2: Fetch portfolio settings by user_id
        const { data: portfolioDataByUserId, error } = await supabase
          .from('portfolio_settings')
          .select('*')
          .eq('user_id', userId)
          .eq('is_public', true)
          .abortSignal(abortControllerRef.current?.signal)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        const portfolioData = portfolioDataByUserId as any;

        // If no profile_image_url in settings, try to get header photo from portfolio_photos
        let headerPhotoUrl = portfolioData?.profile_image_url as string | null | undefined;
        
        if (!headerPhotoUrl) {
          const { data: headerPhoto, error: photoError } = await supabase
            .from('portfolio_photos')
            .select('image_url')
            .eq('user_id', userId)
            .eq('display_order', 0)
            .abortSignal(abortControllerRef.current?.signal)
            .maybeSingle();

          if (!photoError && headerPhoto) {
            headerPhotoUrl = headerPhoto.image_url;
          }
        }

        // If still no header photo, use the first available photo
        if (!headerPhotoUrl) {
          const { data: firstPhoto, error: firstPhotoError } = await supabase
            .from('portfolio_photos')
            .select('image_url')
            .eq('user_id', userId)
            .neq('display_order', 0)
            .order('display_order', { ascending: true })
            .limit(1)
            .abortSignal(abortControllerRef.current?.signal)
            .maybeSingle();

          if (!firstPhotoError && firstPhoto) {
            headerPhotoUrl = firstPhoto.image_url;
          }
        }

        // Include header photo in the data
        const enhancedData = portfolioData ? {
          ...portfolioData,
          profile_image_url: headerPhotoUrl || null
        } : null;

        setData(enhancedData);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching portfolio data:', error);
          toast.error('Failed to load portfolio data');
        }
      } finally {
        setLoading(false);
        fetchPromiseRef.current = null;
      }
    })();

    fetchPromiseRef.current = fetchPromise;
    return fetchPromise;
  }, [username]);

  const updateData = useCallback(async (updates: Partial<PortfolioData>): Promise<boolean> => {
    if (!username || !userProfile) {
      toast.error('Portfolio user not found');
      return false;
    }

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('portfolio_settings')
        .upsert({
          user_id: userProfile.id,
          username: username,
          ...updates,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // Optimistic update
      setData(prev => prev ? { ...prev, ...updates } : null);
      
      return true;
    } catch (error) {
      console.error('Error updating portfolio data:', error);
      toast.error('Failed to update data');
      return false;
    } finally {
      setSaving(false);
    }
  }, [username, userProfile]);

  // Photos functions - using user_id
  const fetchPhotos = useCallback(async () => {
    if (!portfolioUserId) {
      setPhotosLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('portfolio_photos')
        .select('*')
        .eq('user_id', portfolioUserId)
        .neq('display_order', 0) // Exclude header photo
        .order('display_order', { ascending: true })
        .limit(12);

      if (error) throw error;

      setPhotos(data || []);
    } catch (error: any) {
      console.error('Error fetching photos:', error);
      toast.error('Failed to fetch photos');
    } finally {
      setPhotosLoading(false);
    }
  }, [portfolioUserId]);

  const deletePhoto = useCallback(async (photoId: string) => {
    try {
      const { error } = await supabase
        .from('portfolio_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      setPhotos(prev => prev.filter(photo => photo.id !== photoId));
      toast.success('Photo deleted successfully');
    } catch (error: any) {
      console.error('Error deleting photo:', error);
      toast.error('Failed to delete photo');
    }
  }, []);

  // Videos functions - using user_id
  const fetchVideos = useCallback(async () => {
    if (!portfolioUserId) {
      setVideosLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('portfolio_videos')
        .select('*')
        .eq('user_id', portfolioUserId)
        .order('display_order', { ascending: true })
        .limit(40);

      if (error) throw error;
      setVideos(data || []);
    } catch (error: any) {
      console.error('Error fetching videos:', error);
      toast.error('Failed to fetch videos');
    } finally {
      setVideosLoading(false);
    }
  }, [portfolioUserId]);

  const deleteVideo = useCallback(async (videoId: string) => {
    try {
      const { error } = await supabase
        .from('portfolio_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      setVideos(prev => prev.filter(video => video.id !== videoId));
      toast.success('Video deleted successfully');
    } catch (error: any) {
      console.error('Error deleting video:', error);
      toast.error('Failed to delete video');
    }
  }, []);

  const updateVideoOrder = useCallback(async (videoId: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from('portfolio_videos')
        .update({ display_order: newOrder })
        .eq('id', videoId);

      if (error) throw error;

      setVideos(prev => prev.map(video => 
        video.id === videoId ? { ...video, display_order: newOrder } : video
      ));
      toast.success('Video order updated');
    } catch (error: any) {
      console.error('Error updating video order:', error);
      toast.error('Failed to update video order');
    }
  }, []);

  const getEmbedUrl = useCallback((videoUrl: string): string | null => {
    // YouTube URL patterns
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const youtubeMatch = videoUrl.match(youtubeRegex);
    
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Vimeo URL patterns
    const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/;
    const vimeoMatch = videoUrl.match(vimeoRegex);
    
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    return null;
  }, []);

  // Featured Cards functions - using user_id
  const fetchFeaturedCards = useCallback(async () => {
    if (!portfolioUserId) {
      setFeaturedCardsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('portfolio_featured_cards')
        .select('*')
        .eq('user_id', portfolioUserId)
        .order('display_order', { ascending: true })
        .limit(40);

      if (error) throw error;

      setFeaturedCards(data || []);
    } catch (error: any) {
      console.error('Error fetching featured cards:', error);
      toast.error('Failed to fetch featured cards');
    } finally {
      setFeaturedCardsLoading(false);
    }
  }, [portfolioUserId]);

  const createFeaturedCard = useCallback(async (cardData: Omit<FeaturedCard, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<FeaturedCard | null> => {
    if (!username || !userProfile) return null;

    try {
      const { data, error } = await supabase
        .from('portfolio_featured_cards')
        .insert({
          ...cardData,
          user_id: userProfile.id,
          username: username
        })
        .select()
        .single();

      if (error) throw error;

      setFeaturedCards(prev => [...prev, data]);
      toast.success('Featured card created successfully');
      return data;
    } catch (error) {
      console.error('Error creating featured card:', error);
      toast.error('Failed to create featured card');
      return null;
    }
  }, [username, userProfile]);

  const updateFeaturedCard = useCallback(async (id: string, updates: Partial<FeaturedCard>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('portfolio_featured_cards')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setFeaturedCards(prev => prev.map(card => 
        card.id === id ? { ...card, ...updates } : card
      ));
      toast.success('Featured card updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating featured card:', error);
      toast.error('Failed to update featured card');
      return false;
    }
  }, []);

  const deleteFeaturedCard = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('portfolio_featured_cards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFeaturedCards(prev => prev.filter(card => card.id !== id));
      toast.success('Featured card deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting featured card:', error);
      toast.error('Failed to delete featured card');
      return false;
    }
  }, []);

  // Music Releases functions - using user_id
  const fetchMusicReleases = useCallback(async () => {
    if (!portfolioUserId) {
      setMusicReleasesLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('portfolio_music_releases')
        .select('*')
        .eq('user_id', portfolioUserId)
        .order('display_order', { ascending: true })
        .limit(40);

      if (error) throw error;

      setMusicReleases(data || []);
    } catch (error: any) {
      console.error('Error fetching music releases:', error);
      toast.error('Failed to fetch music releases');
    } finally {
      setMusicReleasesLoading(false);
    }
  }, [portfolioUserId]);

  const createMusicRelease = useCallback(async (releaseData: Omit<MusicRelease, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<MusicRelease | null> => {
    if (!username || !userProfile) return null;

    try {
      const { data, error } = await supabase
        .from('portfolio_music_releases')
        .insert({
          ...releaseData,
          user_id: userProfile.id,
          username: username
        })
        .select()
        .single();

      if (error) throw error;

      setMusicReleases(prev => [...prev, data]);
      toast.success('Music release created successfully');
      return data;
    } catch (error) {
      console.error('Error creating music release:', error);
      toast.error('Failed to create music release');
      return null;
    }
  }, [username, userProfile]);

  const updateMusicRelease = useCallback(async (id: string, updates: Partial<MusicRelease>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('portfolio_music_releases')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setMusicReleases(prev => prev.map(release => 
        release.id === id ? { ...release, ...updates } : release
      ));
      toast.success('Music release updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating music release:', error);
      toast.error('Failed to update music release');
      return false;
    }
  }, []);

  const deleteMusicRelease = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('portfolio_music_releases')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMusicReleases(prev => prev.filter(release => release.id !== id));
      toast.success('Music release deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting music release:', error);
      toast.error('Failed to delete music release');
      return false;
    }
  }, []);

  // Events functions - using user_id
  const fetchEvents = useCallback(async () => {
    if (!portfolioUserId) {
      setEventsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('portfolio_events')
        .select('*')
        .eq('user_id', portfolioUserId)
        .order('event_date', { ascending: true })
        .limit(40);

      if (error) throw error;

      setEvents(data || []);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch events');
    } finally {
      setEventsLoading(false);
    }
  }, [portfolioUserId]);

  const createEvent = useCallback(async (eventData: Omit<PortfolioEvent, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<PortfolioEvent | null> => {
    if (!username || !userProfile) return null;

    try {
      const { data, error } = await supabase
        .from('portfolio_events')
        .insert({
          ...eventData,
          user_id: userProfile.id,
          username: username,
          is_enabled: eventData.is_enabled ?? true
        })
        .select()
        .single();

      if (error) throw error;

      setEvents(prev => [...prev, data]);
      toast.success('Event created successfully');
      return data;
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
      return null;
    }
  }, [username, userProfile]);

  const updateEvent = useCallback(async (id: string, updates: Partial<PortfolioEvent>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('portfolio_events')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setEvents(prev => prev.map(event => 
        event.id === id ? { ...event, ...updates } : event
      ));
      toast.success('Event updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
      return false;
    }
  }, []);

  const deleteEvent = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('portfolio_events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEvents(prev => prev.filter(event => event.id !== id));
      toast.success('Event deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
      return false;
    }
  }, []);

  // Smart Links functions - using user_id
  const fetchSmartLinks = useCallback(async () => {
    if (!portfolioUserId) {
      setSmartLinksLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('smart_links')
        .select('*')
        .eq('user_id', portfolioUserId)
        .order('display_order', { ascending: true })
        .limit(40);

      if (error) throw error;
      setSmartLinks(data || []);
    } catch (error: any) {
      console.error('Error fetching smart links:', error);
      toast.error('Failed to fetch smart links');
    } finally {
      setSmartLinksLoading(false);
    }
  }, [portfolioUserId]);

  const createSmartLink = useCallback(async (linkData: Partial<SmartLink>): Promise<SmartLink | null> => {
    if (!userProfile || !linkData.title || !linkData.url) return null;

    try {
      const { data, error } = await supabase
        .from('smart_links')
        .insert({
          title: linkData.title,
          url: linkData.url,
          description: linkData.description,
          thumbnail_url: linkData.thumbnail_url,
          icon_url: linkData.icon_url,
          badge_text: linkData.badge_text,
          badge_color: linkData.badge_color,
          is_featured: linkData.is_featured ?? false,
          is_visible: linkData.is_visible ?? true,
          display_order: linkData.display_order ?? 0,
          click_count: 0,
          custom_styling: linkData.custom_styling,
          user_id: userProfile.id
        })
        .select()
        .single();

      if (error) throw error;

      setSmartLinks(prev => [...prev, data]);
      toast.success('Smart link created successfully');
      return data;
    } catch (error) {
      console.error('Error creating smart link:', error);
      toast.error('Failed to create smart link');
      return null;
    }
  }, [userProfile]);

  const updateSmartLink = useCallback(async (id: string, linkData: Partial<SmartLink>): Promise<SmartLink | null> => {
    try {
      const { data, error } = await supabase
        .from('smart_links')
        .update(linkData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSmartLinks(prev => prev.map(link => 
        link.id === id ? data : link
      ));
      toast.success('Smart link updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating smart link:', error);
      toast.error('Failed to update smart link');
      return null;
    }
  }, []);

  const deleteSmartLink = useCallback(async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('smart_links')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSmartLinks(prev => prev.filter(link => link.id !== id));
      toast.success('Smart link deleted successfully');
    } catch (error) {
      console.error('Error deleting smart link:', error);
      toast.error('Failed to delete smart link');
    }
  }, []);

  const incrementClickCount = useCallback(async (id: string): Promise<void> => {
    try {
      const currentLink = smartLinks.find(link => link.id === id);
      if (!currentLink) return;

      const newClickCount = (currentLink.click_count || 0) + 1;
      
      const { error } = await supabase
        .from('smart_links')
        .update({ click_count: newClickCount })
        .eq('id', id);

      if (error) throw error;

      setSmartLinks(prev => prev.map(link => 
        link.id === id ? { ...link, click_count: newClickCount } : link
      ));
    } catch (error) {
      console.error('Error incrementing click count:', error);
    }
  }, [smartLinks]);

  // Fetch all data when username or portfolioUserId changes
  useEffect(() => {
    if (!username) {
      setLoading(false);
      setPhotosLoading(false);
      setVideosLoading(false);
      setFeaturedCardsLoading(false);
      setMusicReleasesLoading(false);
      setEventsLoading(false);
      setSmartLinksLoading(false);
      return;
    }

    // Fetch core data first
    fetchData();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      fetchPromiseRef.current = null;
    };
  }, [username, fetchData]);

  // Fetch content data when portfolioUserId is available
  useEffect(() => {
    if (!portfolioUserId) return;

    // Fetch all content data in parallel
    Promise.all([
      fetchPhotos(),
      fetchVideos(),
      fetchFeaturedCards(),
      fetchMusicReleases(),
      fetchEvents(),
      fetchSmartLinks()
    ]).catch(error => {
      console.error('Error fetching portfolio content data:', error);
    });
  }, [portfolioUserId, fetchPhotos, fetchVideos, fetchFeaturedCards, fetchMusicReleases, fetchEvents, fetchSmartLinks]);

  const value = useMemo(() => ({
    // Core settings
    data,
    loading,
    saving,
    updateData,
    refetch: fetchData,

    // Photos
    photos,
    photosLoading,
    deletePhoto,
    refetchPhotos: fetchPhotos,

    // Videos
    videos,
    videosLoading,
    deleteVideo,
    updateVideoOrder,
    refetchVideos: fetchVideos,
    getEmbedUrl,

    // Featured Cards
    featuredCards,
    featuredCardsLoading,
    createFeaturedCard,
    updateFeaturedCard,
    deleteFeaturedCard,
    refetchFeaturedCards: fetchFeaturedCards,

    // Music Releases
    musicReleases,
    musicReleasesLoading,
    createMusicRelease,
    updateMusicRelease,
    deleteMusicRelease,
    refetchMusicReleases: fetchMusicReleases,

    // Events
    events,
    eventsLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    refetchEvents: fetchEvents,

    // Smart Links
    smartLinks,
    smartLinksLoading,
    createSmartLink,
    updateSmartLink,
    deleteSmartLink,
    incrementClickCount,
    refetchSmartLinks: fetchSmartLinks,

    // Username-specific
    portfolioUserId,
    userProfile,
  }), [
    data, loading, saving, updateData, fetchData,
    photos, photosLoading, deletePhoto, fetchPhotos,
    videos, videosLoading, deleteVideo, updateVideoOrder, fetchVideos, getEmbedUrl,
    featuredCards, featuredCardsLoading, createFeaturedCard, updateFeaturedCard, deleteFeaturedCard, fetchFeaturedCards,
    musicReleases, musicReleasesLoading, createMusicRelease, updateMusicRelease, deleteMusicRelease, fetchMusicReleases,
    events, eventsLoading, createEvent, updateEvent, deleteEvent, fetchEvents,
    smartLinks, smartLinksLoading, createSmartLink, updateSmartLink, deleteSmartLink, incrementClickCount, fetchSmartLinks,
    portfolioUserId, userProfile
  ]);

  return (
    <UsernamePortfolioDataContext.Provider value={value}>
      {children}
    </UsernamePortfolioDataContext.Provider>
  );
};

export const useUsernamePortfolioData = () => {
  const context = useContext(UsernamePortfolioDataContext);
  if (context === undefined) {
    throw new Error('useUsernamePortfolioData must be used within a UsernamePortfolioDataProvider');
  }
  return context;
};
