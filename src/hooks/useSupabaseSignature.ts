import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSignatureStorage } from './useSignatureStorage';

// Define the SignatureData interface to match our database structure
interface SignatureData {
  id: string;
  signature_type: 'drawn' | 'typed';
  signature: string; // Now stores file path for new signatures, URL for legacy
  signature_text?: string;
  signature_file_path?: string;
  displayUrl?: string; // Signed URL for display
}

// Define the database response type for user signatures
interface UserSignatureRow {
  id: string;
  user_id: string;
  signature_type: 'drawn' | 'typed';
  signature: string;
  signature_text?: string;
  signature_file_path?: string;
  created_at: string;
  updated_at: string;
}

export const useSupabaseSignature = () => {
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { uploadSignature, getSignedUrl, deleteSignature, isUploading } = useSignatureStorage();

  const processSignatureForDisplay = useCallback(async (data: UserSignatureRow): Promise<SignatureData> => {
    const typedData: SignatureData = {
      id: data.id,
      signature_type: data.signature_type,
      signature: data.signature,
      signature_text: data.signature_text || undefined,
      signature_file_path: data.signature_file_path || undefined
    };

    if (data.signature_file_path) {
      const signedUrl = await getSignedUrl(data.signature_file_path);
      if (signedUrl) {
        typedData.displayUrl = signedUrl;
      }
    } else if (data.signature && data.signature.startsWith('http')) {
      typedData.displayUrl = data.signature;
    } else if (data.signature && data.signature.startsWith('data:image')) {
      typedData.displayUrl = data.signature;
    } else if (data.signature_type === 'typed' && data.signature_text) {
      if (data.signature && data.signature.startsWith('data:image')) {
        typedData.displayUrl = data.signature;
      }
    }

    return typedData;
  }, [getSignedUrl]);

  const fetchSignature = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('user_signatures')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() as { 
          data: UserSignatureRow | null; 
          error: any;
        };

      if (error) throw error;
      
      if (data) {
        const processedData = await processSignatureForDisplay(data);
        setSignature(processedData);
      } else {
        setSignature(null);
      }
    } catch (error: any) {
      toast({
        title: 'Error loading signature',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [user, processSignatureForDisplay, toast]);

  const saveSignature = useCallback(async (signatureData: string, type: 'drawn' | 'typed', originalText?: string) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to save a signature.',
        variant: 'destructive'
      });
      return false;
    }

    try {
      const timestamp = Date.now();
      const fileName = `signature-${timestamp}.png`;

      const filePath = await uploadSignature(signatureData, fileName);
      
      if (!filePath) {
        throw new Error('Failed to upload signature to storage');
      }

      const updateData: any = {
        signature_type: type,
        signature: filePath,
        signature_file_path: filePath,
        updated_at: new Date().toISOString()
      };

      if (type === 'typed' && originalText) {
        updateData.signature_text = originalText;
      } else if (type === 'drawn') {
        updateData.signature_text = null;
      }

      let updateOperation;
      let successMessage = 'Signature saved successfully.';

      if (signature) {
        if (signature.signature_file_path) {
          await deleteSignature(signature.signature_file_path);
        }

        updateOperation = supabase
          .from('user_signatures')
          .update(updateData)
          .eq('id', signature.id)
          .eq('user_id', user.id) as any;
        
        successMessage = 'Signature updated successfully.';
      } else {
        const insertData = {
          user_id: user.id,
          ...updateData
        };
        updateOperation = supabase
          .from('user_signatures')
          .insert(insertData) as any;
      }

      const { data, error } = await updateOperation.select();

      if (error) {
        throw error;
      }

      void data;
      
      toast({
        title: 'Signature saved',
        description: successMessage
      });

      await fetchSignature();

      return true;
    } catch (error: any) {
      toast({
        title: 'Error saving signature',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  }, [user, toast, uploadSignature, deleteSignature, signature, fetchSignature]);

  const removeSignature = useCallback(async () => {
    if (!user || !signature) {
      return false;
    }

    try {
      if (signature.signature_file_path) {
        await deleteSignature(signature.signature_file_path);
      }

      const { error } = await supabase
        .from('user_signatures')
        .delete()
        .eq('id', signature.id)
        .eq('user_id', user.id) as { error: any };

      if (error) throw error;

      toast({
        title: 'Signature removed',
        description: 'Your signature has been removed successfully.'
      });

      setSignature(null);
      return true;
    } catch (error: any) {
      toast({
        title: 'Error removing signature',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }
  }, [user, signature, deleteSignature, toast]);

  // Load the signature when the user changes
  useEffect(() => {
    fetchSignature();
  }, [fetchSignature]);

  return {
    signature,
    loading: loading || isUploading,
    fetchSignature,
    saveSignature,
    removeSignature
  };
};
