import React, { createContext, useContext } from 'react';
import { PortfolioMode, PortfolioModeContextType } from '@/types/portfolio';

const PortfolioModeContext = createContext<PortfolioModeContextType | undefined>(undefined);

interface PortfolioModeProviderProps {
  children: React.ReactNode;
  mode: PortfolioMode;
  isPublic: boolean;
  isLive: boolean;
  userHandle: string | null;
}

export const PortfolioModeProvider: React.FC<PortfolioModeProviderProps> = ({
  children,
  mode,
  isPublic,
  isLive,
  userHandle
}) => {
  return (
    <PortfolioModeContext.Provider value={{ mode, isPublic, isLive, userHandle }}>
      {children}
    </PortfolioModeContext.Provider>
  );
};

export const usePortfolioMode = () => {
  const context = useContext(PortfolioModeContext);
  if (context === undefined) {
    throw new Error('usePortfolioMode must be used within a PortfolioModeProvider');
  }
  return context;
};