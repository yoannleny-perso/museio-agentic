
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { useToast } from '@/hooks/use-toast';

export const useSignatureStorage = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const uploadSignature = useCallback(async (signatureData: string, fileName: string): Promise<string | null> => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to upload a signature.',
        variant: 'destructive'
      });
      return null;
    }

    try {
      setIsUploading(true);
      console.log('Uploading signature to private storage...');

      // Convert base64 to blob
      let blob: Blob;
      if (signatureData.startsWith('data:image')) {
        // Convert data URL to blob
        const response = await fetch(signatureData);
        blob = await response.blob();
      } else {
        // Handle raw base64
        const byteCharacters = atob(signatureData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: 'image/png' });
      }

      // Create file path with user ID folder
      const filePath = `${user.id}/${fileName}`;

      // Upload to private Supabase Storage bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user_signatures')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('Signature uploaded successfully to private storage:', filePath);
      // Return the file path instead of public URL for private storage
      return filePath;
    } catch (error: any) {
      console.error('Error uploading signature:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload signature.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [user, toast]);

  const getSignedUrl = useCallback(async (filePath: string): Promise<string | null> => {
    if (!user || !filePath) return null;

    try {
      const { data, error } = await supabase.storage
        .from('user_signatures')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error: any) {
      console.error('Error getting signed URL:', error);
      return null;
    }
  }, [user]);

  const deleteSignature = useCallback(async (filePath: string): Promise<boolean> => {
    if (!user) return false;

    try {
      console.log('Deleting signature from storage:', filePath);

      const { error } = await supabase.storage
        .from('user_signatures')
        .remove([filePath]);

      if (error) {
        console.error('Storage delete error:', error);
        throw error;
      }

      console.log('Signature deleted successfully from storage');
      return true;
    } catch (error: any) {
      console.error('Error deleting signature:', error);
      toast({
        title: 'Delete failed',
        description: error.message || 'Failed to delete signature from storage.',
        variant: 'destructive'
      });
      return false;
    }
  }, [user, toast]);

  return {
    uploadSignature,
    getSignedUrl,
    deleteSignature,
    isUploading
  };
};
