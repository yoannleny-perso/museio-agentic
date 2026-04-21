
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserProfile } from './useUserProfile';

export const usePortfolioPhoto = () => {
  const [uploading, setUploading] = useState(false);
  const [headerPhoto, setHeaderPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { profile } = useUserProfile();

  const getStoragePathFromUrl = (value: string | null | undefined) => {
    if (!value) return null;

    try {
      const url = new URL(value);
      const marker = '/storage/v1/object/public/portfolio-images/';
      const markerIndex = url.pathname.indexOf(marker);

      if (markerIndex === -1) {
        return null;
      }

      return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
    } catch {
      return null;
    }
  };

  const fetchHeaderPhoto = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Only use the dedicated portrait/header photo slot.
      const { data: headerPhoto, error } = await supabase
        .from('portfolio_photos')
        .select('image_url')
        .eq('user_id', user.id)
        .eq('display_order', 0)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      setHeaderPhoto(headerPhoto?.image_url || null);
    } catch (_error) {
      toast.error('Failed to load portrait photo');
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadPhoto = async (file: File): Promise<string | null> => {
    if (!file) return null;

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      toast.error(`File too large. ${file.name} is ${(file.size / 1024 / 1024).toFixed(1)}MB, maximum allowed is 10MB.`);
      return null;
    }

    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload to portfolio-images bucket
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/header-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('portfolio-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('portfolio-images')
        .getPublicUrl(fileName);

      // Save to database (upsert for header photo)
      const { error: dbError } = await supabase
        .from('portfolio_photos')
        .upsert({
          user_id: user.id,
          image_url: publicUrl,
          display_order: 0,
          caption: 'Header Photo',
          username: profile?.username || null
        }, {
          onConflict: 'user_id,display_order'
        });

      if (dbError) throw dbError;

      setHeaderPhoto(publicUrl);
      toast.success('Photo uploaded successfully');
      return publicUrl;
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload photo');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existingPhoto } = await supabase
        .from('portfolio_photos')
        .select('image_url')
        .eq('user_id', user.id)
        .eq('display_order', 0)
        .maybeSingle();

      const { error } = await supabase
        .from('portfolio_photos')
        .delete()
        .eq('user_id', user.id)
        .eq('display_order', 0);

      if (error) throw error;

      const storagePath = getStoragePathFromUrl(existingPhoto?.image_url);
      if (storagePath) {
        await supabase.storage.from('portfolio-images').remove([storagePath]);
      }

      setHeaderPhoto(null);
      toast.success('Photo deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete photo');
    }
  };

  return {
    headerPhoto,
    uploading,
    loading,
    fetchHeaderPhoto,
    uploadPhoto,
    deletePhoto
  };
};
