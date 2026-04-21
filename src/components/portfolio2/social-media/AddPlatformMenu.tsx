
import React from 'react';
import { getSocialIcon } from './socialIconMap';

interface AddPlatformMenuProps {
  availablePlatforms: string[];
  onAddPlatform: (platform: string) => void;
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
    'beatport': 'Beatport'
  };
  return labels[platform] || platform.charAt(0).toUpperCase() + platform.slice(1);
};

const AddPlatformMenu: React.FC<AddPlatformMenuProps> = ({
  availablePlatforms,
  onAddPlatform
}) => {
  return (
    <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 max-h-60 overflow-y-auto">
      <div className="grid grid-cols-2 gap-2 min-w-[250px]">
        {availablePlatforms.map((platform) => (
          <button
            key={platform}
            onClick={() => onAddPlatform(platform)}
            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded text-sm whitespace-nowrap"
          >
            {getSocialIcon(platform)}
            <span>{getPlatformLabel(platform)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AddPlatformMenu;
