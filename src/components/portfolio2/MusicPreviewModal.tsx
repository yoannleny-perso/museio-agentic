import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Play } from 'lucide-react';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';

interface MusicPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  release: {
    id: string;
    title: string;
    artist_name?: string;
    cover_image_url?: string;
    spotify_link?: string;
    apple_music_link?: string;
    youtube_link?: string;
    soundcloud_link?: string;
    beatport_link?: string;
  } | null;
}

const MusicPreviewModal: React.FC<MusicPreviewModalProps> = ({ isOpen, onClose, release }) => {
  const { themeColors } = usePortfolioTheme();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      // Simulate loading for embed
      const timer = setTimeout(() => setIsLoading(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen || !release) return null;

  const extractSpotifyTrackId = (url: string) => {
    const match = url.match(/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  const extractYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  const extractSoundCloudUrl = (url: string) => {
    // SoundCloud embeds need the full URL
    return url.includes('soundcloud.com') ? url : null;
  };

  const getPrimaryStreamingLink = () => {
    if (release.spotify_link) return release.spotify_link;
    if (release.apple_music_link) return release.apple_music_link;
    if (release.youtube_link) return release.youtube_link;
    if (release.soundcloud_link) return release.soundcloud_link;
    if (release.beatport_link) return release.beatport_link;
    return null;
  };

  const renderPreviewContent = () => {
    // Spotify Preview
    if (release.spotify_link) {
      const trackId = extractSpotifyTrackId(release.spotify_link);
      if (trackId) {
        return (
          <div className="w-full h-48">
            <iframe
              src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`}
              width="100%"
              height="100%"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-lg"
            />
          </div>
        );
      }
    }

    // YouTube Preview
    if (release.youtube_link) {
      const videoId = extractYouTubeVideoId(release.youtube_link);
      if (videoId) {
        return (
          <div className="w-full h-48">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              width="100%"
              height="100%"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg"
            />
          </div>
        );
      }
    }

    // SoundCloud Preview
    if (release.soundcloud_link) {
      const soundcloudUrl = extractSoundCloudUrl(release.soundcloud_link);
      if (soundcloudUrl) {
        return (
          <div className="w-full h-48">
            <iframe
              src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(soundcloudUrl)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`}
              width="100%"
              height="100%"
              frameBorder="0"
              allow="autoplay"
              className="rounded-lg"
            />
          </div>
        );
      }
    }

    // Fallback for Apple Music, Beatport, or other platforms
    const primaryLink = getPrimaryStreamingLink();
    const platformName = release.apple_music_link ? 'Apple Music' : 
                        release.beatport_link ? 'Beatport' : 'Music Platform';

    return (
      <div className="text-center py-8">
        <div className="mb-6">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${themeColors.primary}20` }}
          >
            <Play 
              className="w-8 h-8" 
              style={{ color: themeColors.primary }}
            />
          </div>
          <p 
            className="text-sm mb-4"
            style={{ color: themeColors.textSecondary }}
          >
            Preview not available for {platformName}
          </p>
        </div>
        {primaryLink && (
          <a
            href={primaryLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all hover:scale-105"
            style={{
              backgroundColor: themeColors.primary,
              color: '#FFFFFF'
            }}
          >
            <Play className="w-4 h-4 mr-2" />
            Play on {platformName}
            <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-sm rounded-xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: themeColors.cardBackground }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between p-3 border-b"
          style={{ borderColor: themeColors.border }}
        >
          <div className="flex items-center gap-3">
            {release.cover_image_url && (
              <img 
                src={release.cover_image_url} 
                alt={`${release.title} cover`}
                className="w-8 h-8 rounded-lg object-cover border"
                style={{ borderColor: themeColors.border }}
              />
            )}
            <div>
              <h3 
                className="font-bold text-base"
                style={{ color: themeColors.text }}
              >
                {release.title}
              </h3>
              {release.artist_name && (
                <p 
                  className="text-sm"
                  style={{ color: themeColors.textSecondary }}
                >
                  {release.artist_name}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{
              backgroundColor: `${themeColors.textSecondary}20`,
              color: themeColors.textSecondary
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div 
                className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: themeColors.primary }}
              />
            </div>
          ) : (
            renderPreviewContent()
          )}
        </div>
      </div>
    </div>
  );
};

export default MusicPreviewModal;