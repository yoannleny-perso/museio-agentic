
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth';

const INVOICE_LOGOS_BUCKET = 'invoice_logos';

export const useInvoiceLogo = () => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Upload logo to Supabase storage and update settings
  const uploadLogo = async (file: File | null): Promise<string | undefined> => {
    if (!file || !user) {
      return undefined;
    }
    
    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from(INVOICE_LOGOS_BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(INVOICE_LOGOS_BUCKET)
        .getPublicUrl(fileName);

      void data;
      
      return publicUrl;
    } catch (error: any) {
      toast({
        title: "Error uploading logo",
        description: error.message || "Failed to upload logo",
        variant: "destructive"
      });
      return undefined;
    } finally {
      setUploading(false);
    }
  };

  // Upload base64 image data to Supabase storage
  const uploadBase64Logo = async (dataUrl: string): Promise<string | undefined> => {
    if (!dataUrl || !user) {
      return undefined;
    }
    
    try {
      setUploading(true);
      
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      const fileName = `${user.id}/${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from(INVOICE_LOGOS_BUCKET)
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/png'
        });
        
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(INVOICE_LOGOS_BUCKET)
        .getPublicUrl(fileName);
      
      return publicUrl;
    } catch (error: any) {
      toast({
        title: "Error uploading logo",
        description: error.message || "Failed to upload logo",
        variant: "destructive"
      });
      return undefined;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    uploadLogo,
    uploadBase64Logo
  };
};
