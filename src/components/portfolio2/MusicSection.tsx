import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useModedPortfolioData } from '@/context/PortfolioDataContextModed';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';
import { usePortfolioMode } from '@/context/PortfolioModeContext';
import { Edit, Trash2, Music, Plus } from 'lucide-react';
import CarouselDots from '@/components/ui/carousel-dots';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@/components/ui/tooltip';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi
} from '@/components/ui/carousel';
import MusicPreviewModal from './MusicPreviewModal';
import DeleteConfirmDialog from './DeleteConfirmDialog';

const SortableCard = ({ release, children, isReorderMode }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ 
    id: release.id,
    disabled: !isReorderMode
  });
  
  if (!isReorderMode) {
    return <div>{children}</div>;
  }
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

const MusicSection = ({ onAddMusic, onNavigationReady, onEditRelease, sectionKey, isEditMode = true, isCreating = false, editingRelease = null, isReorderMode = false }) => {
  const { mode } = usePortfolioMode();
  const { musicReleases: contextReleases, musicReleasesLoading, deleteMusicRelease, updateMusicRelease } = useModedPortfolioData();
  
  // Filter releases by section key using useMemo to prevent unnecessary re-renders
  const releases = useMemo(() => {
    return sectionKey 
      ? contextReleases?.filter(release => release.section_id === sectionKey) || []
      : contextReleases || [];
  }, [contextReleases, sectionKey]);
  const { themeColors, isDarkTheme } = usePortfolioTheme();

  const [orderedReleases, setOrderedReleases] = useState([]);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState(null);
  const [releaseToDelete, setReleaseToDelete] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    const sectionReleases = releases.filter(r => r.is_enabled && r.section_id === sectionKey);
    setOrderedReleases(sectionReleases);
  }, [releases, sectionKey]);

  const handlePrevious = useCallback(() => {
    if (carouselApi) {
      carouselApi.scrollPrev();
    }
  }, [carouselApi]);

  const handleNext = useCallback(() => {
    if (carouselApi) {
      carouselApi.scrollNext();
    }
  }, [carouselApi]);

  useEffect(() => {
    if (!carouselApi) return;

    const update = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };

    update();
    carouselApi.on('select', update);
    carouselApi.on('reInit', update);

    if (onNavigationReady) {
      onNavigationReady({
        onNavigatePrev: handlePrevious,
        onNavigateNext: handleNext,
        canNavigatePrev: canScrollPrev,
        canNavigateNext: canScrollNext
      });
    }

    return () => {
      carouselApi.off('select', update);
      carouselApi.off('reInit', update);
    };
  }, [carouselApi, canScrollPrev, canScrollNext, onNavigationReady, handlePrevious, handleNext]);

  const groupedSlides = Array.from({ length: Math.ceil(orderedReleases.length / 2) })
    .map((_, i) => orderedReleases.slice(i * 2, i * 2 + 2));

  const scrollToSlide = useCallback((slideIndex: number) => {
    if (carouselApi && slideIndex >= 0 && slideIndex < groupedSlides.length) {
      carouselApi.scrollTo(slideIndex);
    }
  }, [carouselApi, groupedSlides.length]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    if (!carouselApi || !event.over || !isReorderMode) return;

    const draggedItemId = event.active.id;
    const targetItemId = event.over.id;
    
    const targetIndex = orderedReleases.findIndex(r => r.id === targetItemId);
    if (targetIndex === -1) return;
    
    const targetSlideIndex = Math.floor(targetIndex / 2);
    
    if (targetSlideIndex !== currentSlide) {
      scrollToSlide(targetSlideIndex);
    }
  }, [carouselApi, orderedReleases, currentSlide, scrollToSlide, isReorderMode]);

  const handleDragEnd = async ({ active, over }) => {
    if (!isReorderMode || !over || active.id === over.id) return;
    
    const oldIndex = orderedReleases.findIndex(r => r.id === active.id);
    const newIndex = orderedReleases.findIndex(r => r.id === over?.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const newOrderedReleases = arrayMove(orderedReleases, oldIndex, newIndex);
    
    // Optimistically update local state
    setOrderedReleases(newOrderedReleases);
    
    // Update display_order in database for all affected items
    try {
      // Update display_order for each item based on new position
      const updatePromises = newOrderedReleases.map(async (release, index) => {
        if (release.display_order !== index) {
          return updateMusicRelease(release.id, { display_order: index });
        }
        return Promise.resolve(true);
      });
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error updating music release order:', error);
      // Revert local state if database update fails
      setOrderedReleases(orderedReleases);
    }
  };

  const getPrimaryLink = r =>
    r.spotify_link || r.apple_music_link || r.youtube_link || r.soundcloud_link || r.beatport_link || null;

  const getCardColor = i => [themeColors.cardBackgroundPrimary, themeColors.cardBackgroundSecondary, themeColors.cardBackgroundTertiary][i % 3];

  const renderCard = (release, index, shrink = false) => {
    const link = getPrimaryLink(release);
    return (
      <div className={`rounded-xl p-4 shadow-sm group hover:shadow-md transition-shadow w-full ${shrink ? 'scale-[0.97]' : ''}`} style={{ backgroundColor: getCardColor(index) }}>
        <div className="flex items-start gap-4">
          {release.cover_image_url && (
            <img src={release.cover_image_url} alt={release.title} className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
          )}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <h4 className="font-bold text-sm mb-1 truncate cursor-help" style={{ color: themeColors.text }}>{release.title}</h4>
                </TooltipTrigger>
                <TooltipContent><p>{release.title}</p></TooltipContent>
              </Tooltip>
              {release.artist_name && <p className="text-xs mb-2 truncate" style={{ color: themeColors.textSecondary }}>{release.artist_name}</p>}
            </div>
            {link && !isReorderMode && (
              <a href={link} target="_blank" rel="noopener noreferrer" className="mt-auto">
                <Button className="px-4 text-sm font-medium rounded-full border" style={{ backgroundColor: themeColors.cardBackground, borderColor: themeColors.border, color: themeColors.text }}>
                  Play
                </Button>
              </a>
            )}
          </div>
          {mode === 'edit' && !isReorderMode && (
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onEditRelease?.(release)} className="p-2 rounded" style={{ color: themeColors.textSecondary, backgroundColor: `${themeColors.background}80` }}>
                <Edit className="h-4 w-4" />
              </button>
              <button onClick={() => { setReleaseToDelete(release); setShowDeleteDialog(true); }} className="p-2 rounded" style={{ color: themeColors.dangerColor, backgroundColor: `${themeColors.background}80` }}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCarouselContent = () => (
    <Carousel
      setApi={setCarouselApi}
      opts={{ align: 'start', loop: false, slidesToScroll: 1 }}
      className="overflow-visible"
    >
      <CarouselContent className="-ml-2 pr-[10%]">
        {groupedSlides.map((group, slideIndex) => (
          <CarouselItem key={slideIndex} className="pl-2 basis-[90%]">
            <div className="flex flex-col gap-3">
              {group.map((release, i) => (
                <SortableCard key={release.id} release={release} isReorderMode={isReorderMode}>
                  {renderCard(release, slideIndex * 2 + i, groupedSlides.length > 1)}
                </SortableCard>
              ))}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );

  const renderCarouselWithDots = () => (
    <>
      {renderCarouselContent()}
      <CarouselDots
        totalSlides={groupedSlides.length}
        currentSlide={currentSlide}
        onSlideSelect={(index) => carouselApi?.scrollTo(index)}
      />
    </>
  );

  return (
    <TooltipProvider>
      <div className="max-w-4xl mx-auto px-1">
        {orderedReleases.length > 0 ? (
          <>
            {isReorderMode ? (
              <DndContext 
                sensors={sensors} 
                collisionDetection={closestCenter} 
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
              >
                <SortableContext items={orderedReleases.map(r => r.id)} strategy={verticalListSortingStrategy}>
                  {renderCarouselWithDots()}
                </SortableContext>
              </DndContext>
            ) : (
              renderCarouselWithDots()
            )}
          </>
        ) : (
          orderedReleases.length === 0 && !isCreating && !editingRelease && (
          <div className="text-center py-12">
            <div className="rounded-lg p-8 max-w-md mx-auto border-2 border-dashed" style={{ backgroundColor: themeColors.cardBackground, borderColor: themeColors.border, color: themeColors.text }}>
              <Music className="w-12 h-12 mx-auto mb-4" style={{ color: themeColors.textSecondary }} />
              <h3 className="text-lg font-medium mb-4" style={{ color: themeColors.sectionTitleColor }}>No Music Releases Yet</h3>
              {mode === 'edit' && (
                <Button onClick={onAddMusic} className="font-medium transition-all hover:scale-105" style={{ backgroundColor: themeColors.primary, color: '#FFFFFF' }}>
                  <Plus className="w-4 h-4 mr-2" /> Add Release
                </Button>
              )}
            </div>
          </div>
          )
        )}

        <MusicPreviewModal isOpen={previewModalOpen} onClose={() => { setPreviewModalOpen(false); setSelectedRelease(null); }} release={selectedRelease} />
        <DeleteConfirmDialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} onConfirm={async () => { if (mode === 'edit') { await deleteMusicRelease(releaseToDelete?.id); setShowDeleteDialog(false); setReleaseToDelete(null); } }} title="Delete Music Release" message="Are you sure you want to delete this music release? This action cannot be undone." itemName={releaseToDelete?.title} />
      </div>
    </TooltipProvider>
  );
};

export default MusicSection;
