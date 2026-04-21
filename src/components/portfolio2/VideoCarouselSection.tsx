
import React, { useState } from 'react';
import VideoSection from '@/components/portfolio2/VideoSection';
import AddVideoDialog from '@/components/portfolio2/AddVideoDialog';

interface VideoCarouselSectionProps {
  onAddVideo?: () => void;
  onNavigationReady?: (navigation: {
    onNavigatePrev: () => void;
    onNavigateNext: () => void;
    canNavigatePrev: boolean;
    canNavigateNext: boolean;
  }) => void;
  sectionKey?: string;
  isEditMode?: boolean;
}

const VideoCarouselSection: React.FC<VideoCarouselSectionProps> = ({ 
  onAddVideo, 
  onNavigationReady,
  sectionKey,
  isEditMode
}) => {
  return (
      <VideoSection 
        sectionKey={sectionKey}
        isEditMode={isEditMode}
        onAddVideo={onAddVideo} 
        onNavigationReady={onNavigationReady}
      />
  );
};

export default VideoCarouselSection;
