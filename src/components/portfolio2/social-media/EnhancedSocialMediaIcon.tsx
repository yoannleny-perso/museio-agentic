
import React from 'react';
import { SocialMediaLink } from '@/hooks/useSocialMediaLinks';
import { getSocialIcon } from './socialIconMap';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';

interface EnhancedSocialMediaIconProps {
  link: SocialMediaLink;
  onEdit: (platform: string, currentUrl: string) => void;
  isEditMode?: boolean;
  isPlaceholder?: boolean;
}

const getPlatformLabel = (platform: string) => {
  const labels: { [key: string]: string } = {
    'apple-music': 'Apple Music',
    'youtube': 'YouTube',
    'instagram': 'Instagram',
    'facebook': 'Facebook',
    'tiktok': 'TikTok',
    'spotify': 'Spotify',
    'soundcloud': 'SoundCloud',
    'twitter': 'Twitter',
    'linkedin': 'LinkedIn',
    'discord': 'Discord',
    'twitch': 'Twitch',
    'patreon': 'Patreon',
    'bandcamp': 'Bandcamp',
    'mixcloud': 'Mixcloud',
    'beatport': 'Beatport',
    'email': 'Email'
  };
  return labels[platform] || platform.charAt(0).toUpperCase() + platform.slice(1);
};

const EnhancedSocialMediaIcon: React.FC<EnhancedSocialMediaIconProps> = ({ 
  link, 
  onEdit, 
  isEditMode = false,
  isPlaceholder = false
}) => {
  const { themeColors } = usePortfolioTheme();

  const handleClick = (e: React.MouseEvent) => {
    if (isEditMode) {
      e.preventDefault();
      onEdit(link.platform, link.url);
    }
  };

  const IconElement = (
    <div
      className={`
        flex items-center justify-center w-8 h-8 
        transition-all duration-200 transform
        hover:scale-110 hover:drop-shadow-lg
        ${isEditMode ? 'cursor-pointer hover:bg-gray-50 rounded-lg' : ''}
        ${isPlaceholder ? 'opacity-60' : 'opacity-100'}
      `}
      style={{ 
        minWidth: '32px', 
        minHeight: '32px',
        color: themeColors.socialIconColor
      }}
      onClick={handleClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = themeColors.socialIconHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = themeColors.socialIconColor;
      }}
    >
      {isEditMode ? (
        <div className="relative group">
          {getSocialIcon(link.platform)}
          <div 
            className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
            style={{ backgroundColor: `${themeColors.primary}10` }}
          >
            <span 
              className="text-xs font-medium"
              style={{ color: themeColors.text }}
            >
              {isPlaceholder ? 'Add' : 'Edit'}
            </span>
          </div>
        </div>
      ) : !isPlaceholder && link.url ? (
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full h-full"
        >
          {getSocialIcon(link.platform)}
        </a>
      ) : (
        getSocialIcon(link.platform)
      )}
    </div>
  );

  if (isEditMode) {
    return IconElement;
  }

  // Only show tooltip for non-placeholder icons with URLs
  if (!isPlaceholder && link.url) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {IconElement}
        </TooltipTrigger>
        <TooltipContent>
          <p>Follow on {getPlatformLabel(link.platform)}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return IconElement;
};

export default EnhancedSocialMediaIcon;
