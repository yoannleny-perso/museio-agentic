import React from 'react';
import MusicSection from '@/components/portfolio2/MusicSection';

interface MusicCarouselSectionProps {
  onAddMusic?: () => void;
  onNavigationReady?: (navigation: {
    onNavigatePrev: () => void;
    onNavigateNext: () => void;
    canNavigatePrev: boolean;
    canNavigateNext: boolean;
  }) => void;
  sectionKey?: string;
}

const MusicCarouselSection: React.FC<MusicCarouselSectionProps> = ({ 
  onAddMusic, 
  onNavigationReady,
  sectionKey
}) => {
  return (
    <MusicSection 
      onAddMusic={onAddMusic} 
      onNavigationReady={onNavigationReady}
      onEditRelease={() => {}}
      sectionKey={sectionKey}
      isCreating={false}
      editingRelease={null}
    />
  );
};

export default MusicCarouselSection;