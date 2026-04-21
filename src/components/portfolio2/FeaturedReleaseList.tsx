
import React, { useState, useEffect, useCallback } from 'react';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';
import { useModedPortfolioData } from '@/context/PortfolioDataContextModed';
import { Edit, Trash2, Play, Music, Plus, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { extractUrlMetadata } from '@/utils/urlMetadata';
import FeaturedCardPhotoUploader from './FeaturedCardPhotoUploader';
import MusicPreviewModal from './MusicPreviewModal';
import MusicSection from './MusicSection';

interface FeaturedReleaseListProps {
  isEditMode?: boolean;
  onAddContent?: (triggerFn: () => void) => void;
  onNavigationReady?: (navigation: {
    onNavigatePrev: () => void;
    onNavigateNext: () => void;
    canNavigatePrev: boolean;
    canNavigateNext: boolean;
  }) => void;
  sectionKey?: string;
  isReorderMode?: boolean;
}

const FeaturedReleaseList: React.FC<FeaturedReleaseListProps> = ({ 
  isEditMode = true,
  onAddContent, 
  onNavigationReady, 
  sectionKey,
  isReorderMode = false
}) => {
  const {
    musicReleases,
    musicReleasesLoading,
    createMusicRelease,
    updateMusicRelease,
    deleteMusicRelease,
  } = useModedPortfolioData();
  type PortfolioRelease = (typeof musicReleases)[number];
  const { themeColors } = usePortfolioTheme();
  
  // Filter releases by section
  const sectionReleases = musicReleases.filter(
    (release) => release.section_id === (sectionKey ?? null)
  );
  const [isCreating, setIsCreating] = useState(false);
  const [editingRelease, setEditingRelease] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [detectedPlatform, setDetectedPlatform] = useState<string>('');
  const [isExtractingMetadata, setIsExtractingMetadata] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<PortfolioRelease | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    artist_name: '',
    spotify_link: '',
    apple_music_link: '',
    youtube_link: '',
    soundcloud_link: '',
    beatport_link: '',
    cover_image_url: '',
    display_order: 0,
    is_enabled: true
  });

  const platforms = [
    { value: 'spotify', label: 'Spotify', field: 'spotify_link' as keyof typeof formData, color: '#9CA3AF' },
    { value: 'apple', label: 'Apple Music', field: 'apple_music_link' as keyof typeof formData, color: '#9CA3AF' },
    { value: 'youtube', label: 'YouTube', field: 'youtube_link' as keyof typeof formData, color: '#9CA3AF' },
    { value: 'soundcloud', label: 'SoundCloud', field: 'soundcloud_link' as keyof typeof formData, color: '#9CA3AF' },
    { value: 'beatport', label: 'Beatport', field: 'beatport_link' as keyof typeof formData, color: '#9CA3AF' },
  ];

  const enabledReleases = sectionReleases.filter(release => release.is_enabled);

  const detectPlatformFromUrl = (url: string): string | null => {
    if (url.includes('spotify.com')) return 'spotify';
    if (url.includes('apple.com') || url.includes('music.apple.com')) return 'apple';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('soundcloud.com')) return 'soundcloud';
    if (url.includes('beatport.com')) return 'beatport';
    return null;
  };

  const handleUrlChange = async (url: string) => {
    setCurrentUrl(url);
    
    if (!url) {
      setDetectedPlatform('');
      return;
    }

    const platform = detectPlatformFromUrl(url);
    setDetectedPlatform(platform || '');

    // IMMEDIATELY save platform URL to form data when detected
    if (platform) {
      const platformData = platforms.find(p => p.value === platform);
      if (platformData) {
        setFormData(prev => ({ 
          ...prev, 
          [platformData.field]: url 
        }));
      }
    }

    // Auto-extract metadata when URL is valid (optional enhancement)
    if (platform && url.length > 10) {
      setIsExtractingMetadata(true);
      try {
        const metadata = await extractUrlMetadata(url);
        if (metadata) {
          const updates: Partial<typeof formData> = {};
          
          // Pre-populate title and artist if not already set
          if (metadata.title && !formData.title) {
            updates.title = metadata.title;
          }
          if (metadata.artist && !formData.artist_name) {
            updates.artist_name = metadata.artist;
          }
          if (metadata.image && !formData.cover_image_url) {
            updates.cover_image_url = metadata.image;
          }

          setFormData(prev => ({ ...prev, ...updates }));
        }
      } catch (error) {
        console.error('Error extracting metadata:', error);
        // URL is already saved above, so metadata failure doesn't affect URL saving
      } finally {
        setIsExtractingMetadata(false);
      }
    }
  };

  const handleCreateRelease = async () => {
    const releaseData = { ...formData, section_id: sectionKey };
    const result = await createMusicRelease(releaseData);
    if (result) {
      setIsCreating(false);
      setCurrentUrl('');
      setDetectedPlatform('');
      setFormData({
        title: '',
        artist_name: '',
        spotify_link: '',
        apple_music_link: '',
        youtube_link: '',
        soundcloud_link: '',
        beatport_link: '',
        cover_image_url: '',
        display_order: 0,
        is_enabled: true
      });
    }
  };

  const handleUpdateRelease = async (id: string) => {
    await updateMusicRelease(id, formData);
    setEditingRelease(null);
  };

  const startEdit = (release: PortfolioRelease) => {
    setFormData({
      title: release.title,
      artist_name: release.artist_name || '',
      spotify_link: release.spotify_link || '',
      apple_music_link: release.apple_music_link || '',
      youtube_link: release.youtube_link || '',
      soundcloud_link: release.soundcloud_link || '',
      beatport_link: release.beatport_link || '',
      cover_image_url: release.cover_image_url || '',
      display_order: release.display_order,
      is_enabled: release.is_enabled
    });
    setEditingRelease(release.id);
  };

  const getPrimaryStreamingLink = (release: PortfolioRelease) => {
    // Priority order: Spotify → Apple Music → YouTube → SoundCloud → Beatport
    if (release.spotify_link) return release.spotify_link;
    if (release.apple_music_link) return release.apple_music_link;
    if (release.youtube_link) return release.youtube_link;
    if (release.soundcloud_link) return release.soundcloud_link;
    if (release.beatport_link) return release.beatport_link;
    return null;
  };


  const handleRemoveLink = (platformField: keyof typeof formData) => {
    setFormData(prev => ({
      ...prev,
      [platformField]: ''
    }));
  };

  const getAddedLinks = () => {
    return platforms.filter(platform => formData[platform.field]).map(platform => ({
      ...platform,
      url: formData[platform.field] as string
    }));
  };

  const handleAddRelease = useCallback(() => {
    setIsCreating(true);
  }, []);

  // Handle external add content trigger
  useEffect(() => {
    if (onAddContent && isEditMode) {
      onAddContent(handleAddRelease);
    }
  }, [onAddContent, handleAddRelease, isEditMode]);

  if (musicReleasesLoading) {
    return (
      <div className="space-y-3">
        <div 
          className="h-20 rounded-xl animate-pulse" 
          style={{ backgroundColor: `${themeColors.textSecondary}20` }}
        />
        <div 
          className="h-20 rounded-xl animate-pulse" 
          style={{ backgroundColor: `${themeColors.textSecondary}20` }}
        />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div>
      {isEditMode && (isCreating || editingRelease) && (
        <div 
          className="border rounded-xl p-4 mb-4 shadow-sm"
          style={{
            backgroundColor: themeColors.cardBackground,
            borderColor: themeColors.border
          }}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Song/Album title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="p-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: themeColors.inputBackground,
                  borderColor: themeColors.inputBorder,
                  color: themeColors.text,
                  boxShadow: `0 0 0 2px ${themeColors.primary}20`
                }}
              />
              <input
                type="text"
                placeholder="Artist name"
                value={formData.artist_name}
                onChange={(e) => setFormData(prev => ({ ...prev, artist_name: e.target.value }))}
                className="p-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: themeColors.inputBackground,
                  borderColor: themeColors.inputBorder,
                  color: themeColors.text,
                  boxShadow: `0 0 0 2px ${themeColors.primary}20`
                }}
              />
            </div>
            {/* Cover Image Preview */}
            {formData.cover_image_url && (
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: themeColors.text }}>
                  Cover Art:
                </label>
                <div className="flex items-center gap-3">
                  <img 
                    src={formData.cover_image_url} 
                    alt="Cover art preview"
                    className="w-16 h-16 rounded-lg object-cover border"
                    style={{ borderColor: themeColors.border }}
                  />
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, cover_image_url: '' }))}
                    className="p-2 rounded-lg transition-colors"
                    style={{
                      backgroundColor: `${themeColors.textSecondary}20`,
                      color: themeColors.textSecondary
                    }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Added Links Display */}
            {getAddedLinks().length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: themeColors.text }}>
                  Platform Links:
                </label>
                <div className="flex flex-wrap gap-2">
                  {getAddedLinks().map((link) => (
                    <div
                      key={link.value}
                      className="flex items-center gap-2 px-3 py-1 rounded-full text-sm"
                      style={{ backgroundColor: `${link.color}20`, color: link.color }}
                    >
                      <span>{link.label}</span>
                      <button
                        onClick={() => handleRemoveLink(link.field)}
                        className="hover:opacity-70 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Streamlined URL Input */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium" style={{ color: themeColors.textSecondary }}>
                  Music Platform URL:
                </label>
                {detectedPlatform && (
                  <span 
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ 
                      backgroundColor: `${platforms.find(p => p.value === detectedPlatform)?.color}20`,
                      color: platforms.find(p => p.value === detectedPlatform)?.color
                    }}
                  >
                    {platforms.find(p => p.value === detectedPlatform)?.label}
                  </span>
                )}
                {isExtractingMetadata && (
                  <span className="text-xs" style={{ color: themeColors.textSecondary }}>
                    Extracting...
                  </span>
                )}
              </div>
              <input
                type="url"
                placeholder="Paste Spotify, Apple Music, YouTube, SoundCloud, or Beatport link"
                value={currentUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: themeColors.inputBackground,
                  borderColor: themeColors.inputBorder,
                  color: themeColors.text,
                  boxShadow: `0 0 0 2px ${themeColors.primary}20`
                }}
              />
            </div>

            {/* Manual Cover Art Upload */}
            {!formData.cover_image_url && (
              <div className="space-y-2">
                <label className="text-sm font-medium" style={{ color: themeColors.text }}>
                  Cover Art Upload:
                </label>
                <div className="w-32">
                  <FeaturedCardPhotoUploader
                    currentImage={formData.cover_image_url}
                    onImageChange={(url) => setFormData(prev => ({ ...prev, cover_image_url: url || '' }))}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={isCreating ? handleCreateRelease : () => handleUpdateRelease(editingRelease!)}
                disabled={!formData.title}
                className="px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                style={{
                  backgroundColor: themeColors.primary,
                  color: '#FFFFFF'
                }}
              >
                {isCreating ? 'Create' : 'Update'}
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingRelease(null);
                  setCurrentUrl('');
                  setDetectedPlatform('');
                }}
                className="px-4 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: `${themeColors.textSecondary}20`,
                  color: themeColors.text
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <MusicSection 
        onAddMusic={handleAddRelease}
        onNavigationReady={onNavigationReady}
        onEditRelease={startEdit}
        sectionKey={sectionKey}
        isEditMode={isEditMode}
        isCreating={isCreating}
        editingRelease={editingRelease}
        isReorderMode={isReorderMode}
      />

      <MusicPreviewModal
        isOpen={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setSelectedRelease(null);
        }}
        release={selectedRelease}
      />
      </div>
    </TooltipProvider>
  );
};

export default FeaturedReleaseList;
