import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Move, Upload, Trash2 } from 'lucide-react';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';
import { useModedPortfolioData } from '@/context/PortfolioDataContextModed';
import { usePortfolioMode } from '@/context/PortfolioModeContext';
import AddPhotoDialog from './AddPhotoDialog';
import PhotoLightbox from './PhotoLightbox';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from '@/components/ui/carousel';
import CarouselDots from '@/components/ui/carousel-dots';

interface PhotoGalleryProps {
  onNavigationReady?: (navigation: {
    onNavigatePrev: () => void;
    onNavigateNext: () => void;
    canNavigatePrev: boolean;
    canNavigateNext: boolean;
  }) => void;
  sectionKey?: string;
  isEditMode?: boolean;
  isReorderMode?: boolean;
  onReorderModeChange?: (enabled: boolean) => void;
}

const SortableCard = ({ photo, children, isReorderMode }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: photo.id,
    disabled: !isReorderMode
  });
  
  if (!isReorderMode) {
    return <div className="h-full">{children}</div>;
  }
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : 1,
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`h-full touch-none ${isDragging ? 'relative z-20' : ''}`}
    >
      {children}
    </div>
  );
};

const PhotoGallery = forwardRef<{ triggerAddPhoto: () => void }, PhotoGalleryProps>(({ onNavigationReady, sectionKey, isEditMode = true, isReorderMode = false, onReorderModeChange }, ref) => {
  const { mode } = usePortfolioMode();
  const { photos: contextPhotos, photosLoading, uploadPhotos, deletePhoto, updatePhotoOrder } = useModedPortfolioData();
  const [uploading, setUploading] = useState(false);
  const [orderedPhotos, setOrderedPhotos] = useState<typeof contextPhotos>([]);
  const [justReordered, setJustReordered] = useState(false);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Wrapper to handle uploading state
  const handleUploadPhotos = async (files: File[], sectionId?: string) => {
    setUploading(true);
    try {
      await uploadPhotos(files, sectionId);
    } finally {
      setUploading(false);
    }
  };
  
  // Filter photos by section key using useMemo
  const photos = useMemo(() => {
    return sectionKey 
      ? contextPhotos?.filter(photo => photo.section_id === sectionKey) || []
      : contextPhotos || [];
  }, [contextPhotos, sectionKey]);

  useEffect(() => {
    // Don't override local state if we just performed a reorder
    if (justReordered) {
      setJustReordered(false);
      return;
    }
    
    const sectionPhotos = photos
      .filter(p => p.section_id === sectionKey || (!sectionKey && !p.section_id))
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    setOrderedPhotos(sectionPhotos);
  }, [photos, sectionKey, justReordered]);

  const { themeColors } = usePortfolioTheme();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null);

  const shouldUseCarousel = orderedPhotos.length > 4;

  const handleDragEnd = async ({ active, over }) => {
    if (!isReorderMode || !over || active.id === over.id) return;
    
    const oldIndex = orderedPhotos.findIndex(p => p.id === active.id);
    const newIndex = orderedPhotos.findIndex(p => p.id === over?.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const newOrderedPhotos = arrayMove(orderedPhotos, oldIndex, newIndex);
    
    // Optimistically update local state
    setOrderedPhotos(newOrderedPhotos);
    setJustReordered(true);
    
    // Update display_order in database
    try {
      const preservedOrderSlots = orderedPhotos
        .map((photo) => photo.display_order)
        .filter((order): order is number => typeof order === 'number' && Number.isFinite(order))
        .sort((a, b) => a - b);

      const updates = newOrderedPhotos.map((photo, index) => ({
        id: photo.id,
        newOrder: preservedOrderSlots[index] ?? photo.display_order ?? index + 1
      }));
      
      const success = await updatePhotoOrder(updates);
      
      if (!success) {
        setOrderedPhotos(orderedPhotos);
        setJustReordered(false);
      }
    } catch (error) {
      // Revert local state if database update fails
      setOrderedPhotos(orderedPhotos);
      setJustReordered(false);
    }
  };

  const handleAddPhoto = () => {
    setShowAddDialog(true);
  };

  useImperativeHandle(ref, () => ({
    triggerAddPhoto: handleAddPhoto
  }));

  const handlePhotosAdded = () => {
    // Photos will refresh automatically via the hook
  };

  const handleDeleteClick = (photoId: string) => {
    setPhotoToDelete(photoId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (photoToDelete && mode === 'edit') {
      await deletePhoto(photoToDelete);
      setShowDeleteDialog(false);
      setPhotoToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setPhotoToDelete(null);
  };

  const handleDeletePhoto = async (photoId: string) => {
    await deletePhoto(photoId);
  };

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index);
    setShowLightbox(true);
  };

  const handleSlideSelect = (slideIndex: number) => {
    if (api) {
      api.scrollTo(slideIndex);
    }
  };

  const renderPhotoCard = (photo, index: number, key?: React.Key) => (
    <Card
      key={key ?? photo.id}
      className={`overflow-hidden transition-all ${
        isReorderMode
          ? 'cursor-grab active:cursor-grabbing ring-1 ring-primary/15 shadow-md'
          : 'group cursor-pointer hover:shadow-lg'
      }`}
    >
      <div
        className="aspect-square relative"
        onClick={!isReorderMode ? () => handlePhotoClick(index) : undefined}
      >
        <img
          src={photo.image_url}
          alt="Portfolio photo"
          draggable={false}
          className="h-full w-full select-none object-cover"
        />

        {isReorderMode && (
          <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between rounded-full bg-black/55 px-3 py-1.5 text-white shadow-sm">
            <span className="text-xs font-medium">Drag to reorder</span>
            <Move className="h-4 w-4" />
          </div>
        )}

        {/* Delete button - only show in edit mode and not in reorder mode */}
        {mode === 'edit' && !isReorderMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(photo.id);
            }}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black bg-opacity-50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-70"
            title="Delete photo"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </Card>
  );

  const renderReorderGrid = () => (
    <div className="space-y-4">
      <p
        className="text-center text-sm"
        style={{ color: themeColors.textSecondary }}
      >
        Drag photos to change their order.
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedPhotos.map((photo) => photo.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 gap-4">
            {orderedPhotos.map((photo, index) => (
              <SortableCard key={photo.id} photo={photo} isReorderMode={isReorderMode}>
                {renderPhotoCard(photo, index)}
              </SortableCard>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );

  // Update navigation state and notify parent when carousel API changes
  useEffect(() => {
    if (!api || !shouldUseCarousel) return;

    const updateScrollState = () => {
      const canPrev = api.canScrollPrev();
      const canNext = api.canScrollNext();
      const selectedIndex = api.selectedScrollSnap();
      
      setCanScrollPrev(canPrev);
      setCanScrollNext(canNext);
      setCurrentSlide(selectedIndex);

      if (onNavigationReady) {
        onNavigationReady({
          onNavigatePrev: () => {
            if (api.canScrollPrev()) {
              api.scrollPrev();
            }
          },
          onNavigateNext: () => {
            if (api.canScrollNext()) {
              api.scrollNext();
            }
          },
          canNavigatePrev: canPrev,
          canNavigateNext: canNext,
        });
      }
    };

    updateScrollState();
    api.on('select', updateScrollState);
    api.on('reInit', updateScrollState);

    return () => {
      api.off('select', updateScrollState);
      api.off('reInit', updateScrollState);
    };
  }, [api, onNavigationReady, shouldUseCarousel]);


  if (photosLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-1">

      {orderedPhotos.length > 0 ? (
        isReorderMode ? (
          renderReorderGrid()
        ) : shouldUseCarousel ? (
          <>
            <Carousel
              setApi={setApi}
              opts={{
                align: "start",
                loop: false,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2">
                {Array.from({ length: Math.ceil(orderedPhotos.length / 4) }).map((_, slideIndex) => (
                  <CarouselItem key={slideIndex} className="pl-2 basis-11/12">
                    <div className="grid grid-cols-2 gap-4">
                      {orderedPhotos.slice(slideIndex * 4, (slideIndex + 1) * 4).map((photo, photoIndex) => {
                        const actualIndex = slideIndex * 4 + photoIndex;
                        return renderPhotoCard(photo, actualIndex, photo.id);
                      })}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
            <CarouselDots
              totalSlides={Math.ceil(orderedPhotos.length / 4)}
              currentSlide={currentSlide}
              onSlideSelect={handleSlideSelect}
            />
          </>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {orderedPhotos.map((photo, index) => renderPhotoCard(photo, index, photo.id))}
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <div 
            className="rounded-lg p-8 max-w-md mx-auto border-2 border-dashed transition-colors"
            style={{
              backgroundColor: themeColors.cardBackground,
              borderColor: themeColors.border,
              color: themeColors.text
            }}
          >
            <Upload 
              className="w-12 h-12 mx-auto mb-4" 
              style={{ color: themeColors.textSecondary }}
            />
            <h3 
              className="text-lg font-medium mb-4"
              style={{ color: themeColors.sectionTitleColor }}
            >
              No Photos Yet
            </h3>
            {mode === 'edit' && !isReorderMode && (
              <Button 
                onClick={handleAddPhoto}
                className="font-medium transition-all hover:scale-105"
                style={{
                  backgroundColor: themeColors.primary,
                  color: '#FFFFFF',
                  borderColor: themeColors.primary
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = themeColors.buttonHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = themeColors.primary;
                }}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Photos
              </Button>
            )}
          </div>
        </div>
      )}

      <AddPhotoDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onPhotosAdded={handlePhotosAdded}
        onUpload={handleUploadPhotos}
        uploading={uploading}
        sectionId={sectionKey}
      />

      <PhotoLightbox
        open={showLightbox}
        onOpenChange={setShowLightbox}
        photos={orderedPhotos}
        initialPhotoIndex={selectedPhotoIndex}
        onDeletePhoto={handleDeletePhoto}
        isEditMode={isEditMode}
      />

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Photo"
        message="Are you sure you want to delete this photo? This action cannot be undone."
      />
    </div>
  );
});

PhotoGallery.displayName = 'PhotoGallery';

export default PhotoGallery;
