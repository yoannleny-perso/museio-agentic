import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Plus, Trash2 } from 'lucide-react';
import CarouselDots from '@/components/ui/carousel-dots';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';
import { useModedPortfolioData } from '@/context/PortfolioDataContextModed';
import { usePortfolioMode } from '@/context/PortfolioModeContext';
import AddVideoDialog from './AddVideoDialog';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from '@/components/ui/carousel';

interface VideoSectionProps {
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

const VideoSection: React.FC<VideoSectionProps> = ({ 
  onAddVideo, 
  onNavigationReady, 
  sectionKey, 
  isEditMode = true 
}) => {
  const { mode } = usePortfolioMode();
  const { videos, videosLoading, refetchVideos, getEmbedUrl, deleteVideo } = useModedPortfolioData();
  const { themeColors } = usePortfolioTheme();
  const sectionVideos = useMemo(
    () => (sectionKey ? videos.filter((video) => video.section_id === sectionKey) : videos),
    [sectionKey, videos]
  );
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<{id: string, title?: string} | null>(null);
  const numberOfVideos = sectionVideos.length;

  // Always use carousel for better video visibility

  const handleAddVideo = () => {
    if (onAddVideo) {
      onAddVideo();
    } else {
      setShowAddDialog(true);
    }
  };

  const handleVideoAdded = async () => {
    await refetchVideos();
  };

  const handleDeleteClick = (video: {id: string, title?: string}) => {
    setVideoToDelete(video);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (videoToDelete && mode === 'edit') {
      await deleteVideo(videoToDelete.id);
      setShowDeleteDialog(false);
      setVideoToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setVideoToDelete(null);
  };

  const handlePlayVideo = (videoId: string) => {
    setPlayingVideoId(playingVideoId === videoId ? null : videoId);
  };

  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const getVimeoVideoId = (url: string) => {
    const regExp = /(?:vimeo)\.com.*(?:videos|video|channels|)\/([\d]+)/i;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const getThumbnailUrl = (videoUrl: string) => {
    const youtubeId = getYouTubeVideoId(videoUrl);
    if (youtubeId) {
      return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
    }
    
    const vimeoId = getVimeoVideoId(videoUrl);
    if (vimeoId) {
      // For Vimeo, we'll use a placeholder or fetch from their API
      return `https://vumbnail.com/${vimeoId}.jpg`;
    }
    
    return null;
  };

  // Update navigation state and notify parent when carousel API changes
  useEffect(() => {
    if (!api) return;

    const updateScrollState = () => {
      const canPrev = api.canScrollPrev();
      const canNext = api.canScrollNext();
      const selectedIndex = api.selectedScrollSnap();
      
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
  }, [api, onNavigationReady]);

  if (videosLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-video bg-gray-200" />
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {sectionVideos.length > 0 ? (
        <div className="space-y-6">
          {/* Playing video (full width) */}
          {playingVideoId && sectionVideos.find(v => v.id === playingVideoId) && (
            <div className="transition-all duration-500 ease-in-out">
              {(() => {
                const playingVideo = sectionVideos.find(v => v.id === playingVideoId)!;
                const embedUrl = getEmbedUrl(playingVideo.video_url);
                
                return (
                  <Card className="overflow-hidden shadow-xl animate-scale-in">
                    <div className="aspect-video relative">
                      {embedUrl && (
                        <iframe
                          src={embedUrl}
                          className="w-full h-full"
                          frameBorder="0"
                          allow="autoplay; encrypted-media"
                          allowFullScreen
                          title={playingVideo.title || 'Video player'}
                        />
                      )}
                      
                      {/* Close video button */}
                      <button
                        onClick={() => setPlayingVideoId(null)}
                        className="absolute top-4 right-4 p-2 rounded-full bg-black bg-opacity-70 text-white hover:bg-opacity-90 transition-all hover:scale-110"
                        title="Close video"
                      >
                        ✕
                      </button>
                      
                      {/* Delete button - only show in edit mode */}
                      {mode === 'edit' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick({id: playingVideo.id, title: playingVideo.title});
                          }}
                          className="absolute top-4 left-4 p-2 rounded-lg bg-black bg-opacity-70 text-white hover:bg-opacity-90 transition-all hover:scale-110"
                          title="Delete video"
                        >
                          <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                        </button>
                      )}
                    </div>
                    
                  </Card>
                );
              })()}
            </div>
          )}
          
          {/* Prominent video carousel with peek view */}
          <Carousel
            setApi={setApi}
            opts={{
              align: "center",
              loop: true,
              containScroll: "trimSnaps",
            }}
            className={`w-full transition-all duration-500 ${playingVideoId ? 'opacity-60 scale-95' : ''}`}
          >
            <CarouselContent className="-ml-4">
              {sectionVideos.filter(video => video.id !== playingVideoId).map((video) => {
                const thumbnailUrl = getThumbnailUrl(video.video_url);
                
                return (
                  <CarouselItem key={video.id} className="pl-4 basis-full md:basis-4/5 lg:basis-5/6">
                    <div className="overflow-hidden hover:shadow-2xl transition-all duration-300 group hover:scale-105 rounded-xl">
                      <div className="aspect-video relative rounded-xl overflow-hidden bg-gray-100">
                        {thumbnailUrl ? (
                          <>
                            <img 
                              src={thumbnailUrl}
                              alt={video.title || 'Video thumbnail'}
                              className="w-full h-full object-cover cursor-pointer"
                              onClick={() => handlePlayVideo(video.id)}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-50 transition-all duration-300">
                              <div 
                                className="rounded-full p-2 md:p-4 group-hover:scale-125 transition-transform duration-300 cursor-pointer"
                                onClick={() => handlePlayVideo(video.id)}
                              >
                                <Play className="w-6 h-6 md:w-8 md:h-8 text-white ml-1" />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div 
                            className="w-full h-full bg-gray-200 flex items-center justify-center cursor-pointer group-hover:bg-gray-300 transition-colors"
                            onClick={() => handlePlayVideo(video.id)}
                          >
                            <Play className="w-8 h-8 md:w-12 md:h-12 text-gray-400" />
                          </div>
                        )}
                        
                        {/* Enhanced title overlay */}
                        {video.title && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 md:p-6">
                            <h3 className="text-white text-lg md:text-xl font-semibold leading-tight">
                              {video.title}
                            </h3>
                          </div>
                        )}
                        
                        {/* Enhanced delete button - only show in edit mode */}
                        {mode === 'edit' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick({id: video.id, title: video.title});
                            }}
                            className="absolute top-3 right-3 p-1.5 md:p-2 rounded-lg bg-black bg-opacity-60 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-opacity-80 hover:scale-110"
                            title="Delete video"
                          >
                            <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>
          <CarouselDots
            totalSlides={numberOfVideos}
            currentSlide={currentSlide}
            onSlideSelect={(index) => api?.scrollTo(index)}
          />
        </div>
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
            <Play 
              className="w-12 h-12 mx-auto mb-4" 
              style={{ color: themeColors.textSecondary }}
            />
            <h3 
              className="text-lg font-medium mb-4"
              style={{ color: themeColors.sectionTitleColor }}
            >
              No Videos Yet
            </h3>
            <Button 
              onClick={handleAddVideo}
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
              <Plus className="w-4 h-4 mr-2" />
              Add Video
            </Button>
          </div>
        </div>
      )}

      <AddVideoDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onVideoAdded={handleVideoAdded}
      />

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Video"
        message="Are you sure you want to delete this video? This action cannot be undone."
        itemName={videoToDelete?.title}
      />
    </>
  );
};

export default VideoSection;
