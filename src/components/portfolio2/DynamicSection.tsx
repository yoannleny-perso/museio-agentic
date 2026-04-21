
import React, { useRef, useState } from 'react';
import FeaturedPromoCards, { FeaturedPromoCardsRef } from './FeaturedPromoCards';
import FeaturedReleaseList from './FeaturedReleaseList';
import VideoCarouselSection from './VideoCarouselSection';
import PhotoGalleryCarousel from './PhotoGalleryCarousel';
import NextShowCarousel from './NextShowCarousel';
import BookMeSection from './BookMeSection';
import SectionHeader from './SectionHeader';
import AddVideoDialog from './AddVideoDialog';
import { useModedPortfolioSections, SectionConfig } from '@/hooks/useModedPortfolioSections';
import { useModedPortfolioData } from '@/context/PortfolioDataContextModed';
import { toast } from '@/components/ui/sonner';

interface DynamicSectionProps {
  sectionKey: string;
  config: SectionConfig;
  title: string;
  isDynamic?: boolean;
  dragHandleProps?: Record<string, any>;
  isSortable?: boolean;
  isDragging?: boolean;
  isDraggedOver?: boolean;
  // Edit mode
  isEditMode?: boolean;
}

const DynamicSection: React.FC<DynamicSectionProps> = ({ 
  sectionKey, 
  config, 
  title, 
  isDynamic = false,
  dragHandleProps,
  isSortable = false,
  isDragging = false,
  isDraggedOver = false,
  isEditMode = true
}) => {
  const { removeSection, updateSectionTitle, isBuiltInSection } = useModedPortfolioSections();
  const { featuredCards, refetchVideos } = useModedPortfolioData();

  // Refs for child components
  const featuredCardsRef = useRef<FeaturedPromoCardsRef>(null);
  const musicReleaseAddRef = useRef<(() => void) | null>(null);
  const photoGalleryAddRef = useRef<(() => void) | null>(null);
  const nextShowAddRef = useRef<(() => void) | null>(null);

  // Dialog states
  const [showAddVideoDialog, setShowAddVideoDialog] = useState(false);
  // Reorder mode states for sections that support it
  const [isPhotoReorderMode, setIsPhotoReorderMode] = useState(false);
  const [isMusicReorderMode, setIsMusicReorderMode] = useState(false);

  const handleTitleSave = async (newTitle: string) => {
    return await updateSectionTitle(sectionKey, newTitle);
  };

  const handleDelete = async () => {
    await removeSection(sectionKey);
  };

  const handleAddContent = () => {
    if (!isEditMode) return;
    
    switch (config.type) {
      case 'FeaturedPromoCards':
        if (featuredCardsRef.current?.triggerAdd) {
          featuredCardsRef.current.triggerAdd();
        }
        break;
      case 'VideoCarouselSection':
        setShowAddVideoDialog(true);
        break;
      case 'PhotoGalleryCarousel':
        if (photoGalleryAddRef.current) {
          photoGalleryAddRef.current();
        }
        break;
      case 'FeaturedReleaseList':
        if (musicReleaseAddRef.current) {
          musicReleaseAddRef.current();
        }
        break;
      case 'NextShowCarousel':
        if (nextShowAddRef.current) {
          nextShowAddRef.current();
        }
        break;
      case 'BookMeSection':
        // BookMe section doesn't have add content functionality
        // Could open a customization dialog here in the future
        toast.info('Book Me section customization is not available yet.');
        break;
    }
  };

  const handleVideoAdded = async () => {
    await refetchVideos();
  };

  const renderSectionContent = () => {
    switch (config.type) {
      case 'FeaturedPromoCards':
        return <FeaturedPromoCards sectionKey={sectionKey} isEditMode={isEditMode} ref={featuredCardsRef} />;
      case 'FeaturedReleaseList':
        return (
          <FeaturedReleaseList 
            sectionKey={sectionKey}
            isEditMode={isEditMode}
            onAddContent={(triggerFn) => {
              musicReleaseAddRef.current = triggerFn;
            }} 
            isReorderMode={isMusicReorderMode}
          />
        );
      case 'VideoCarouselSection':
        return (
          <VideoCarouselSection 
            sectionKey={sectionKey}
            isEditMode={isEditMode}
            onAddVideo={() => setShowAddVideoDialog(true)} 
          />
        );
      case 'PhotoGalleryCarousel':
        return (
          <PhotoGalleryCarousel 
            sectionKey={sectionKey}
            onAddContent={(triggerFn) => {
              photoGalleryAddRef.current = triggerFn;
            }}
            isEditMode={isEditMode}
            isReorderMode={isPhotoReorderMode}
          />
        );
      case 'NextShowCarousel':
        return <NextShowCarousel 
          sectionKey={sectionKey} 
          onAddContent={(triggerFn) => {
            nextShowAddRef.current = triggerFn;
          }}
          isEditMode={isEditMode}
        />;
      case 'BookMeSection':
        return <BookMeSection sectionKey={sectionKey} isEditMode={isEditMode} />;
      default:
        return null;
    }
  };

  const hasEnabledCards = config.type === 'FeaturedPromoCards' &&
    featuredCards.some((card) => card.section_id === sectionKey && card.is_enabled);

  // Determine if section supports reorder mode
  const supportsReorder = config.type === 'PhotoGalleryCarousel' || config.type === 'FeaturedReleaseList';
  const currentReorderMode = config.type === 'PhotoGalleryCarousel' ? isPhotoReorderMode : isMusicReorderMode;

  // Hide add button for certain section types
  const shouldHideAddButton = hasEnabledCards || config.type === 'BookMeSection';

  return (
    <div>
      <SectionHeader
        sectionKey={sectionKey}
        title={title}
        onTitleSave={handleTitleSave}
        onDelete={handleDelete}
        onAddContent={isEditMode && !shouldHideAddButton ? handleAddContent : undefined}
        isBuiltIn={isBuiltInSection(sectionKey)}
        hideAddButton={shouldHideAddButton}
        isEditMode={isEditMode}
        dragHandleProps={dragHandleProps}
        isSortable={isSortable}
        isDragging={isDragging}
        isDraggedOver={isDraggedOver}
        showReorderToggle={supportsReorder && isEditMode}
        isReorderMode={currentReorderMode}
        onReorderModeChange={(enabled) => {
          if (config.type === 'PhotoGalleryCarousel') {
            setIsPhotoReorderMode(enabled);
          } else if (config.type === 'FeaturedReleaseList') {
            setIsMusicReorderMode(enabled);
          }
        }}
      />
      {renderSectionContent()}
      {/* Dialogs - Only render for relevant section types and in edit mode */}
      {isEditMode && config.type === 'VideoCarouselSection' && (
        <AddVideoDialog
          open={showAddVideoDialog}
          onOpenChange={setShowAddVideoDialog}
          onVideoAdded={handleVideoAdded}
          sectionId={sectionKey}
        />
      )}
    </div>
  );
};

export default DynamicSection;
