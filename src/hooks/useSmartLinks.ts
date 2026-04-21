
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SmartLink } from '@/types';
import { toast } from 'sonner';

export const useSmartLinks = () => {
  const [smartLinks, setSmartLinks] = useState<SmartLink[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSmartLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('smart_links')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      // Type assertion to handle the Json type from Supabase
      const typedData = (data || []).map(item => ({
        ...item,
        custom_styling: item.custom_styling || {}
      })) as SmartLink[];
      
      setSmartLinks(typedData);
    } catch (error) {
      console.error('Error fetching smart links:', error);
      toast.error('Failed to load smart links');
    } finally {
      setLoading(false);
    }
  };

  const createLink = async (linkData: Partial<SmartLink>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const maxOrder = smartLinks.length > 0 
        ? Math.max(...smartLinks.map(link => link.display_order))
        : 0;

      const { data, error } = await supabase
        .from('smart_links')
        .insert({
          ...linkData,
          user_id: user.id,
          display_order: maxOrder + 1,
          title: linkData.title || '',
          url: linkData.url || ''
        })
        .select()
        .single();

      if (error) throw error;
      
      // Type assertion for the returned data
      const typedData = {
        ...data,
        custom_styling: data.custom_styling || {}
      } as SmartLink;
      
      setSmartLinks(prev => [...prev, typedData]);
      toast.success('Link created successfully');
      return typedData;
    } catch (error) {
      console.error('Error creating smart link:', error);
      toast.error('Failed to create link');
      throw error;
    }
  };

  const updateLink = async (id: string, linkData: Partial<SmartLink>) => {
    try {
      const { data, error } = await supabase
        .from('smart_links')
        .update(linkData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Type assertion for the returned data
      const typedData = {
        ...data,
        custom_styling: data.custom_styling || {}
      } as SmartLink;
      
      setSmartLinks(prev => 
        prev.map(link => link.id === id ? typedData : link)
      );
      toast.success('Link updated successfully');
      return typedData;
    } catch (error) {
      console.error('Error updating smart link:', error);
      toast.error('Failed to update link');
      throw error;
    }
  };

  const deleteLink = async (id: string) => {
    try {
      const { error } = await supabase
        .from('smart_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSmartLinks(prev => prev.filter(link => link.id !== id));
      toast.success('Link deleted successfully');
    } catch (error) {
      console.error('Error deleting smart link:', error);
      toast.error('Failed to delete link');
      throw error;
    }
  };

  const incrementClickCount = async (id: string) => {
    try {
      const currentLink = smartLinks.find(link => link.id === id);
      if (!currentLink) return;

      const { error } = await supabase
        .from('smart_links')
        .update({ 
          click_count: currentLink.click_count + 1
        })
        .eq('id', id);

      if (error) throw error;
      
      setSmartLinks(prev =>
        prev.map(link =>
          link.id === id 
            ? { ...link, click_count: link.click_count + 1 }
            : link
        )
      );
    } catch (error) {
      console.error('Error incrementing click count:', error);
    }
  };

  useEffect(() => {
    fetchSmartLinks();
  }, []);

  return {
    smartLinks,
    loading,
    createLink,
    updateLink,
    deleteLink,
    incrementClickCount,
    refetch: fetchSmartLinks
  };
};
