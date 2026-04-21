import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from '@/components/ui/carousel';

interface PortfolioPhoto {
  id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface PhotoLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: PortfolioPhoto[];
  initialPhotoIndex: number;
  onDeletePhoto: (photoId: string) => void;
  isEditMode?: boolean;
}

const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  open,
  onOpenChange,
  photos,
  initialPhotoIndex,
  onDeletePhoto,
  isEditMode = true
}) => {
  const { themeColors } = usePortfolioTheme();
  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(initialPhotoIndex);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Update carousel when initialPhotoIndex changes
  useEffect(() => {
    if (api && open) {
      api.scrollTo(initialPhotoIndex);
      setCurrentIndex(initialPhotoIndex);
    }
  }, [api, initialPhotoIndex, open]);

  // Handle carousel state changes
  useEffect(() => {
    if (!api) return;

    const updateSelection = () => {
      setCurrentIndex(api.selectedScrollSnap());
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };

    api.on('select', updateSelection);
    updateSelection();

    return () => {
      api.off('select', updateSelection);
    };
  }, [api]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      } else if (event.key === 'ArrowLeft' && canScrollPrev) {
        api?.scrollPrev();
      } else if (event.key === 'ArrowRight' && canScrollNext) {
        api?.scrollNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, api, canScrollPrev, canScrollNext, onOpenChange]);

  const currentPhoto = photos[currentIndex];

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!currentPhoto) return;
    
    await onDeletePhoto(currentPhoto.id);
    setShowDeleteDialog(false);
    
    // Close lightbox if this was the last photo
    if (photos.length <= 1) {
      onOpenChange(false);
    } else {
      // Move to previous photo if we're at the end
      if (currentIndex >= photos.length - 1 && api) {
        api.scrollTo(Math.max(0, currentIndex - 1));
      }
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
  };

  if (!currentPhoto || photos.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-[95vw] h-screen p-0 border-0 bg-transparent shadow-none flex items-center justify-center"
        hideCloseButton={true}
      >
        <DialogTitle className="sr-only">Photo viewer</DialogTitle>
        <DialogDescription className="sr-only">
          Viewing photo {currentIndex + 1} of {photos.length}.
        </DialogDescription>
        {/* Header with controls */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
          <div className="text-gray-700 text-sm font-medium bg-white/80 px-3 py-1 rounded-full backdrop-blur-sm">
            {currentIndex + 1} of {photos.length}
          </div>
          <div className="flex gap-2">
            {isEditMode && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDeleteClick}
                className="text-gray-700 bg-white/80 hover:bg-red-100 hover:text-red-600 backdrop-blur-sm"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-gray-700 bg-white/80 hover:bg-gray-200 hover:text-gray-800 backdrop-blur-sm"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Carousel container */}
        <div className="relative w-full h-full flex items-center justify-center">
          <Carousel
            setApi={setApi}
            className="w-full h-full"
            opts={{
              startIndex: initialPhotoIndex,
              loop: true
            }}
          >
            <CarouselContent className="h-full">
              {photos.map((photo, index) => (
                <CarouselItem key={photo.id} className="flex items-center justify-center h-full">
                  <div className="relative flex items-center justify-center w-full h-full">
                    <img
                      src={photo.image_url}
                      alt="Portfolio photo"
                      className="max-w-full max-h-full object-contain"
                      style={{ maxHeight: 'calc(95vh - 4rem)' }}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Navigation arrows - only show if more than 1 photo */}
            {photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 bg-white/80 hover:bg-gray-200 hover:text-gray-800 disabled:opacity-30 backdrop-blur-sm"
                  onClick={() => api?.scrollPrev()}
                  disabled={!canScrollPrev}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-700 bg-white/80 hover:bg-gray-200 hover:text-gray-800 disabled:opacity-30 backdrop-blur-sm"
                  onClick={() => api?.scrollNext()}
                  disabled={!canScrollNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
          </Carousel>
        </div>
      </DialogContent>

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Photo"
        message="Are you sure you want to delete this photo? This action cannot be undone."
      />
    </Dialog>
  );
};

export default PhotoLightbox;
