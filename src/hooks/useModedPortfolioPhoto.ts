
import { useState, useCallback } from 'react';
import { usePortfolioPhoto } from '@/hooks/usePortfolioPhoto';
import { useModedPortfolioData } from '@/context/PortfolioDataContextModed';
import { usePortfolioMode } from '@/context/PortfolioModeContext';

export const useModedPortfolioPhoto = () => {
  const { mode } = usePortfolioMode();
  const authPhoto = usePortfolioPhoto();
  const { data: portfolioData } = useModedPortfolioData();
  
  // For edit mode, use the authenticated photo hook
  if (mode === 'edit') {
    return authPhoto;
  }
  
  // For live mode, get header photo from portfolio data context
  // This will be populated by the UsernamePortfolioDataContext
  return {
    headerPhoto: portfolioData?.profile_image_url || null,
    uploading: false,
    loading: false,
    fetchHeaderPhoto: () => Promise.resolve(),
    uploadPhoto: async () => null,
    deletePhoto: async () => {}
  };
};
