
export type PortfolioMode = 'edit' | 'live';

export interface PortfolioModeContextType {
  mode: PortfolioMode;
  isPublic: boolean;
  isLive: boolean;
  userHandle: string | null;
}
