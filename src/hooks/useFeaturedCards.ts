
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth';
import { useModedPortfolioData } from '@/context/PortfolioDataContextModed';
import { usePortfolioMode } from '@/context/PortfolioModeContext';
import { useUserProfile } from './useUserProfile';
import { supabase } from '@/integrations/supabase/client';

export interface FeaturedCard {
  id: string;
  user_id: string;
  title: string;
  subtitle?: string;
  button_text: string;
  button_link?: string;
  background_image_url?: string;
  background_color: string;
  icon_url?: string;
  display_order: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const useFeaturedCards = (sectionId?: string) => {
  const { user } = useAuth();
  const { mode } = usePortfolioMode();
  const { userProfile } = useModedPortfolioData();
  const { profile } = useUserProfile();
  const [cards, setCards] = useState<FeaturedCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = useCallback(async () => {
    // In edit mode, use authenticated user; in live mode, use userProfile
    const targetUserId = mode === 'edit' ? user?.id : (userProfile && 'id' in userProfile ? userProfile.id : null);
    
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('portfolio_featured_cards')
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
        console.error('Error fetching featured cards:', error);
        return;
      }

      setCards(data || []);
    } catch (error) {
      console.error('Error fetching featured cards:', error);
    } finally {
      setLoading(false);
    }
  }, [mode, sectionId, user?.id, userProfile]);

  const createCard = async (cardData: Omit<FeaturedCard, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (mode !== 'edit' || !user) return null;

    try {
      const { data, error } = await supabase
        .from('portfolio_featured_cards')
        .insert({
          ...cardData,
          user_id: user.id,
          section_id: sectionId || null,
          username: profile?.username || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating featured card:', error);
        return null;
      }

      await fetchCards();
      return data;
    } catch (error) {
      console.error('Error creating featured card:', error);
      return null;
    }
  };

  const updateCard = async (id: string, updates: Partial<FeaturedCard>) => {
    if (mode !== 'edit') return false;
    
    try {
      const { error } = await supabase
        .from('portfolio_featured_cards')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating featured card:', error);
        return false;
      }

      await fetchCards();
      return true;
    } catch (error) {
      console.error('Error updating featured card:', error);
      return false;
    }
  };

  const deleteCard = async (id: string) => {
    if (mode !== 'edit') return false;
    
    try {
      const { error } = await supabase
        .from('portfolio_featured_cards')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting featured card:', error);
        return false;
      }

      await fetchCards();
      return true;
    } catch (error) {
      console.error('Error deleting featured card:', error);
      return false;
    }
  };

  useEffect(() => {
    void fetchCards();
  }, [fetchCards]);

  return {
    cards,
    loading,
    createCard,
    updateCard,
    deleteCard,
    refetch: fetchCards
  };
};
