
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth';
import { useModedPortfolioData } from '@/context/PortfolioDataContextModed';
import { usePortfolioMode } from '@/context/PortfolioModeContext';
import { useUserProfile } from './useUserProfile';
import { supabase } from '@/integrations/supabase/client';

export interface MusicRelease {
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
  display_order: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const useMusicReleases = (sectionId?: string) => {
  const { user } = useAuth();
  const { mode } = usePortfolioMode();
  const { userProfile } = useModedPortfolioData();
  const { profile } = useUserProfile();
  const [releases, setReleases] = useState<MusicRelease[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReleases = useCallback(async () => {
    // In edit mode, use authenticated user; in live mode, use userProfile
    const targetUserId = mode === 'edit' ? user?.id : (userProfile && 'id' in userProfile ? userProfile.id : null);
    
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('portfolio_music_releases')
        .select('*')
        .eq('user_id', targetUserId);

      // Filter by section_id if provided
      if (sectionId) {
        query = query.eq('section_id', sectionId);
      }

      const { data, error } = await query
        .order('display_order', { ascending: true })
        .limit(40);

      if (error) {
        console.error('Error fetching music releases:', error);
        return;
      }

      setReleases(data || []);
    } catch (error) {
      console.error('Error fetching music releases:', error);
    } finally {
      setLoading(false);
    }
  }, [mode, sectionId, user?.id, userProfile]);

  const createRelease = async (releaseData: Omit<MusicRelease, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (mode !== 'edit' || !user) return null;

    try {
      const { data, error } = await supabase
        .from('portfolio_music_releases')
        .insert({
          ...releaseData,
          user_id: user.id,
          section_id: sectionId || null,
          username: profile?.username || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating music release:', error);
        return null;
      }

      await fetchReleases();
      return data;
    } catch (error) {
      console.error('Error creating music release:', error);
      return null;
    }
  };

  const updateRelease = async (id: string, updates: Partial<MusicRelease>) => {
    if (mode !== 'edit') return false;
    
    try {
      const { error } = await supabase
        .from('portfolio_music_releases')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating music release:', error);
        return false;
      }

      await fetchReleases();
      return true;
    } catch (error) {
      console.error('Error updating music release:', error);
      return false;
    }
  };

  const deleteRelease = async (id: string) => {
    if (mode !== 'edit') return false;
    
    try {
      const { error } = await supabase
        .from('portfolio_music_releases')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting music release:', error);
        return false;
      }

      await fetchReleases();
      return true;
    } catch (error) {
      console.error('Error deleting music release:', error);
      return false;
    }
  };

  useEffect(() => {
    void fetchReleases();
  }, [fetchReleases]);

  return {
    releases,
    loading,
    createRelease,
    updateRelease,
    deleteRelease,
    refetch: fetchReleases
  };
};
