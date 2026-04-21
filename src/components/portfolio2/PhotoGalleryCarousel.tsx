
import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import PhotoGallery from '@/components/portfolio2/PhotoGallery';

interface PhotoGalleryCarouselProps {
  onNavigationReady?: (navigation: {
    onNavigatePrev: () => void;
    onNavigateNext: () => void;
    canNavigatePrev: boolean;
    canNavigateNext: boolean;
  }) => void;
  sectionKey?: string;
  onAddContent?: (triggerFn: () => void) => void;
  isEditMode?: boolean;
  isReorderMode?: boolean;
}

const PhotoGalleryCarousel: React.FC<PhotoGalleryCarouselProps> = ({ 
  onNavigationReady,
  sectionKey,
  onAddContent,
  isEditMode = true,
  isReorderMode = false
}) => {
  const photoGalleryRef = useRef<{ triggerAddPhoto: () => void } | null>(null);

  const handleAddPhoto = () => {
    photoGalleryRef.current?.triggerAddPhoto();
  };

  // Register the add function with the parent
  React.useEffect(() => {
    if (onAddContent) {
      onAddContent(handleAddPhoto);
    }
  }, [onAddContent]);

  return (
    <div>
      <PhotoGallery 
        sectionKey={sectionKey}
        onNavigationReady={onNavigationReady}
        ref={photoGalleryRef}
        isEditMode={isEditMode}
        isReorderMode={isReorderMode}
      />
    </div>
  );
};

export default PhotoGalleryCarousel;
