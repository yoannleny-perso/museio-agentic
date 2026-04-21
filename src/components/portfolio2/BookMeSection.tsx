
import React, { Suspense, lazy, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, UserCheck } from 'lucide-react';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';
import { useModedPortfolioData } from '@/context/PortfolioDataContextModed';
import { usePortfolioMode } from '@/context/PortfolioModeContext';
import { toast } from '@/components/ui/sonner';

const BookingModal = lazy(() => import('./BookingModal'));

interface BookMeSectionProps {
  sectionKey: string;
  isEditMode?: boolean;
}

const BookMeSection: React.FC<BookMeSectionProps> = ({ 
  sectionKey, 
  isEditMode = true 
}) => {
  const { themeColors } = usePortfolioTheme();
  const { data } = useModedPortfolioData();
  const { userHandle } = usePortfolioMode();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [artistUsername, setArtistUsername] = useState<string>('');
  

  // Get custom options from section config
  const sectionConfigs = data?.section_configs as Record<string, any> || {};
  const customOptions = sectionConfigs[sectionKey]?.custom_options || {};
  
  const buttonText = customOptions.buttonText || 'Book Me';
  const description = customOptions.description || '';
  const buttonStyle = customOptions.buttonStyle || 'primary';

  const handleBookMeClick = async () => {
    if (isEditMode) {
      toast.info('Open the public portfolio to test the booking flow.');
      return;
    }
    
    // In live mode, get the artist's username (handle) from the portfolio context
    const handle = userHandle || '';
    setArtistUsername(handle);
    setIsBookingModalOpen(true);
  };

  const getButtonStyles = () => {
    const baseClasses = "w-full py-4 px-6 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl";
    
    switch (buttonStyle) {
      case 'secondary':
        return `${baseClasses} border-2 hover:bg-opacity-10`;
      case 'outline':
        return `${baseClasses} bg-transparent border-2 hover:bg-opacity-10`;
      default: // 'primary'
        return `${baseClasses} text-white shadow-lg hover:shadow-2xl`;
    }
  };

  const getButtonStyleProps = () => {
    switch (buttonStyle) {
      case 'secondary':
        return {
          backgroundColor: `${themeColors.secondary}20`,
          borderColor: themeColors.secondary,
          color: themeColors.secondary
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: themeColors.primary,
          color: themeColors.primary
        };
      default: // 'primary'
        return {
          backgroundColor: themeColors.primary,
          borderColor: themeColors.primary,
          color: '#FFFFFF'
        };
    }
  };

  return (
    <div className="text-center space-y-4 py-6">
      {description && (
        <p 
          className="text-lg mb-6 leading-relaxed"
          style={{ color: themeColors.textSecondary }}
        >
          {description}
        </p>
      )}
      
      <Button
        onClick={handleBookMeClick}
        
        className={getButtonStyles()}
        style={getButtonStyleProps()}
        onMouseEnter={(e) => {
          if (buttonStyle === 'primary') {
            e.currentTarget.style.backgroundColor = `${themeColors.primary}DD`;
          } else {
            e.currentTarget.style.backgroundColor = `${themeColors.primary}15`;
          }
        }}
        onMouseLeave={(e) => {
          const styles = getButtonStyleProps();
          e.currentTarget.style.backgroundColor = styles.backgroundColor;
        }}
      >
        <div className="flex items-center justify-center gap-3">
          <UserCheck className="w-6 h-6" />
          <span>{buttonText}</span>
          <Calendar className="w-6 h-6" />
        </div>
      </Button>

      {isEditMode && (
        <p 
          className="text-sm mt-3 opacity-70"
          style={{ color: themeColors.textSecondary }}
        >
          In live mode, this button will open the booking popup
        </p>
      )}

      {isBookingModalOpen && (
        <Suspense fallback={null}>
          <BookingModal
            isOpen={isBookingModalOpen}
            onClose={() => setIsBookingModalOpen(false)}
            artistUsername={artistUsername}
          />
        </Suspense>
      )}
    </div>
  );
};

export default BookMeSection;
