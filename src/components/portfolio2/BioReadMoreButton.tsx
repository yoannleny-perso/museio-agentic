
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBio } from '@/hooks/useBio';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';
import { usePortfolioMode } from '@/context/PortfolioModeContext';

interface BioReadMoreButtonProps {
  onToggleBio: () => void;
  showFullBio: boolean;
  isEditingFullBio?: boolean;
}

const BioReadMoreButton: React.FC<BioReadMoreButtonProps> = ({ onToggleBio, showFullBio, isEditingFullBio = false }) => {
  const { bioShort, bioFull, loading } = useBio();
  const { themeColors } = usePortfolioTheme();
  const { mode } = usePortfolioMode();

  // Don't show anything if loading
  if (loading) {
    return null;
  }

  const hasAdditionalContent = bioFull && bioFull.trim() !== '';
  const hasAnyContent = bioShort || bioFull;

  if (!hasAnyContent) {
    return null;
  }

  const buttonText = showFullBio 
    ? 'Read Less' 
    : hasAdditionalContent 
      ? 'Read More' 
      : 'Add Full Bio';

  // If it's "Add Full Bio" (no additional content), only render in edit mode
  if (!hasAdditionalContent && !showFullBio) {
    // Don't show "Add Full Bio" button in live mode or when editing full bio
    if (mode === 'live' || isEditingFullBio) {
      return null;
    }
    
    return (
      <div className="flex justify-center mt-2 mb-2">
        <Button
          onClick={onToggleBio}
          variant="outline"
          className="flex items-center gap-2 px-4 py-2 border-2 border-dashed transition-colors"
          style={{
            borderColor: themeColors.border,
            color: themeColors.textSecondary,
            backgroundColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = themeColors.primary;
            e.currentTarget.style.backgroundColor = `${themeColors.primary}10`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = themeColors.border;
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Plus className="h-4 w-4" style={{ color: themeColors.textSecondary }} />
          {buttonText}
        </Button>
      </div>
    );
  }

  // For "Read More" / "Read Less", keep as text button
  return (
    <div className="text-center mt-2 mb-2">
      <button
        onClick={onToggleBio}
        className="text-sm hover:underline focus:outline-none font-medium transition-colors"
        style={{ color: themeColors.primary }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = themeColors.primary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = themeColors.primary;
        }}
      >
        {buttonText}
      </button>
    </div>
  );
};

export default BioReadMoreButton;
