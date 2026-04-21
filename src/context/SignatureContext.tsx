
import React, { createContext, useContext, ReactNode } from 'react';
import { useSupabaseSignature } from '@/hooks/useSupabaseSignature';

// Define the SignatureData interface to match our database structure
interface SignatureData {
  id: string;
  signature_type: 'drawn' | 'typed';
  signature: string;
  signature_text?: string;
  signature_file_path?: string;
  displayUrl?: string;
}

interface SignatureContextType {
  signature: SignatureData | null;
  loading: boolean;
  fetchSignature: () => Promise<void>;
  saveSignature: (signature: string, type: 'drawn' | 'typed', originalText?: string) => Promise<boolean>;
  removeSignature: () => Promise<boolean>;
}

const SignatureContext = createContext<SignatureContextType | undefined>(undefined);

export const useSignature = () => {
  const context = useContext(SignatureContext);
  if (context === undefined) {
    throw new Error('useSignature must be used within a SignatureProvider');
  }
  return context;
};

interface SignatureProviderProps {
  children: ReactNode;
}

export const SignatureProvider: React.FC<SignatureProviderProps> = ({ children }) => {
  const supabaseSignature = useSupabaseSignature();

  const value: SignatureContextType = {
    signature: supabaseSignature.signature,
    loading: supabaseSignature.loading,
    fetchSignature: supabaseSignature.fetchSignature,
    saveSignature: supabaseSignature.saveSignature,
    removeSignature: supabaseSignature.removeSignature,
  };

  return (
    <SignatureContext.Provider value={value}>
      {children}
    </SignatureContext.Provider>
  );
};
