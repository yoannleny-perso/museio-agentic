import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth';
import { useModedPortfolioData } from '@/context/PortfolioDataContextModed';
import { usePortfolioMode } from '@/context/PortfolioModeContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PortfolioVideo {
  id: string;
  video_url: string;
  title: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export const useVideoManagement = (sectionId?: string) => {
  const { user } = useAuth();
  const { mode } = usePortfolioMode();
  const { userProfile } = useModedPortfolioData();
  const [videos, setVideos] = useState<PortfolioVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchVideos = useCallback(async () => {
    try {
      // In edit mode, use authenticated user; in live mode, use userProfile
      const targetUserId = mode === 'edit' ? user?.id : (userProfile && 'id' in userProfile ? userProfile.id : null);
      
      if (!targetUserId) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from('portfolio_videos')
        .select('*')
        .eq('user_id', targetUserId);

      // Filter by section_id if provided
      if (sectionId) {
        query = query.eq('section_id', sectionId);
      }

      const { data, error } = await query
        .order('display_order', { ascending: true })
        .limit(40);

      if (error) throw error;
      setVideos(data || []);
    } catch (error: any) {
      console.error('Error fetching videos:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch videos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [mode, sectionId, toast, user?.id, userProfile]);

  const deleteVideo = async (videoId: string) => {
    if (mode !== 'edit') return;
    
    try {
      const { error } = await supabase
        .from('portfolio_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      setVideos(prev => prev.filter(video => video.id !== videoId));
      
      toast({
        title: 'Success',
        description: 'Video deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting video:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete video',
        variant: 'destructive'
      });
    }
  };

  const updateVideoOrder = async (videoId: string, newOrder: number) => {
    if (mode !== 'edit') return;
    
    try {
      const { error } = await supabase
        .from('portfolio_videos')
        .update({ display_order: newOrder })
        .eq('id', videoId);

      if (error) throw error;

      setVideos(prev => 
        prev.map(video => 
          video.id === videoId 
            ? { ...video, display_order: newOrder }
            : video
        ).sort((a, b) => a.display_order - b.display_order)
      );
    } catch (error: any) {
      console.error('Error updating video order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update video order',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    void fetchVideos();
  }, [fetchVideos]);

  const getEmbedUrl = (videoUrl: string): string | null => {
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
  };

  return {
    videos,
    loading,
    refetchVideos: fetchVideos,
    deleteVideo,
    updateVideoOrder,
    getEmbedUrl
  };
};
