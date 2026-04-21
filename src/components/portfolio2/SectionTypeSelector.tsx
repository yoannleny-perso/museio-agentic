
import React from 'react';
import { Button } from '@/components/ui/button';
import { Music, Video, Image, Calendar, Star, UserCheck } from 'lucide-react';
import { SectionConfig } from '@/hooks/useModedPortfolioSections';
import PortfolioDialog from './PortfolioDialog';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';

interface SectionTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: SectionConfig['type']) => void;
}

const sectionTypes = [
  {
    type: 'FeaturedPromoCards' as const,
    name: 'Featured Cards',
    description: 'Promotional cards with custom backgrounds and links',
    icon: Star,
    color: 'text-purple-600'
  },
  {
    type: 'FeaturedReleaseList' as const,
    name: 'Music Releases',
    description: 'Display music releases with streaming links',
    icon: Music,
    color: 'text-blue-600'
  },
  {
    type: 'VideoCarouselSection' as const,
    name: 'Video Gallery',
    description: 'Showcase videos in a carousel format',
    icon: Video,
    color: 'text-red-600'
  },
  {
    type: 'PhotoGalleryCarousel' as const,
    name: 'Photo Gallery',
    description: 'Display photos in a grid layout',
    icon: Image,
    color: 'text-green-600'
  },
  {
    type: 'NextShowCarousel' as const,
    name: 'Events & Shows',
    description: 'List upcoming events and ticket information',
    icon: Calendar,
    color: 'text-orange-600'
  },
  {
    type: 'BookMeSection' as const,
    name: 'Book Me',
    description: 'Add a booking button for clients to request your services',
    icon: UserCheck,
    color: 'text-pink-600'
  }
];

const SectionTypeSelector: React.FC<SectionTypeSelectorProps> = ({
  isOpen,
  onClose,
  onSelect
}) => {
  const { themeColors } = usePortfolioTheme();

  const handleSelect = (type: SectionConfig['type']) => {
    onSelect(type);
    onClose();
  };

  return (
    <PortfolioDialog
      open={isOpen}
      onOpenChange={onClose}
      title="Add New Section"
    >
      <div className="space-y-3">
        {sectionTypes.map((sectionType) => {
          const IconComponent = sectionType.icon;
          return (
            <Button
              key={sectionType.type}
              variant="outline"
              className="w-full p-4 h-auto flex items-start gap-3 transition-colors"
              onClick={() => handleSelect(sectionType.type)}
              
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${themeColors.primary}10`;
                e.currentTarget.style.borderColor = themeColors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = themeColors.border;
              }}
            >
              <IconComponent 
                className="h-5 w-5 mt-0.5 flex-shrink-0" 
                style={{ color: themeColors.primary }}
              />
              <div className="text-left flex-1 min-w-0">
                <div className="font-medium whitespace-normal break-words">
                  {sectionType.name}
                </div>
                <div className="text-sm mt-1 whitespace-normal break-words leading-relaxed">
                  {sectionType.description}
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </PortfolioDialog>
  );
};

export default SectionTypeSelector;
