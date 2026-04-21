import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PortfolioPhoto {
  id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

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

export const usePhotoManagement = (sectionId?: string) => {
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const fetchPhotos = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('portfolio_photos')
        .select('*')
        .eq('user_id', user.id)
        .neq('display_order', 0); // Exclude header photo

      // Filter by section_id if provided
      if (sectionId) {
        query = query.eq('section_id', sectionId);
      }

      const { data, error } = await query
        .order('display_order', { ascending: true })
        .limit(12);

      if (error) throw error;
      setPhotos(data || []);
    } catch (error: any) {
      console.error('Error fetching photos:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch photos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [sectionId, toast]);

  const uploadPhotos = async (files: File[], sectionId?: string) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Validate file sizes (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
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
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('portfolio-images')
          .upload(fileName, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('portfolio-images')
          .getPublicUrl(fileName);

        const { data: insertedPhoto, error: dbError } = await supabase
          .from('portfolio_photos')
          .insert({
            user_id: user.id,
            image_url: publicUrl,
            section_id: sectionId || null,
            display_order: nextOrder++
          })
          .select()
          .single();

        if (dbError) {
          await supabase.storage.from('portfolio-images').remove([fileName]);
          throw dbError;
        }
        return insertedPhoto;
      });

      const newPhotos = await Promise.all(uploadPromises);

      // Optimistically update the photos state with newly uploaded photos
      setPhotos(prev => [...prev, ...newPhotos].sort((a, b) => a.display_order - b.display_order));

      toast({
        title: 'Success',
        description: `${files.length} photo(s) uploaded successfully!`
      });

      // Refresh photos after a short delay to ensure consistency
      setTimeout(() => {
        void fetchPhotos();
      }, 100);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload photos',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photoId: string) => {
    try {
      const photoToDelete = photos.find((photo) => photo.id === photoId);
      const { error } = await supabase
        .from('portfolio_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      const storagePath = getStoragePathFromUrl(photoToDelete?.image_url);
      if (storagePath) {
        await supabase.storage.from('portfolio-images').remove([storagePath]);
      }

      setPhotos(prev => prev.filter(photo => photo.id !== photoId));
      
      toast({
        title: 'Success',
        description: 'Photo deleted successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete photo',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    void fetchPhotos();
  }, [fetchPhotos]);

  return {
    photos,
    loading,
    uploading,
    refetchPhotos: fetchPhotos,
    uploadPhotos,
    deletePhoto
  };
};
