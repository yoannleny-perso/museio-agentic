
import React from 'react';
import { getSocialIcon } from './socialIconMap';
import PortfolioDialog from '../PortfolioDialog';

interface EnhancedAddPlatformMenuProps {
  open: boolean;
  availablePlatforms: string[];
  onAddPlatform: (platform: string) => void;
  onClose: () => void;
}

const getPlatformInfo = (platform: string) => {
  const platformInfo: { [key: string]: { label: string; description: string } } = {
    'tiktok': { 
      label: 'TikTok', 
      description: 'Viral short videos, trends, music discovery' 
    },
    'youtube': { 
      label: 'YouTube', 
      description: 'Music videos, live sets, behind-the-scenes content' 
    },
    'spotify': { 
      label: 'Spotify', 
      description: 'Streaming profile, followers, playlists' 
    },
    'twitter': { 
      label: 'X (formerly Twitter)', 
      description: 'Quick updates, personality, trending convos' 
    },
    'bandcamp': { 
      label: 'Bandcamp', 
      description: 'Direct-to-fan music sales, merch, support' 
    },
    'email': { 
      label: 'Email', 
      description: 'Booking requests, fan messages, newsletters' 
    },
    'apple-music': { label: 'Apple Music', description: 'Streaming profile' },
    'linkedin': { label: 'LinkedIn', description: 'Professional networking' },
    'discord': { label: 'Discord', description: 'Community building' },
    'twitch': { label: 'Twitch', description: 'Live streaming' },
    'patreon': { label: 'Patreon', description: 'Fan support & subscriptions' },
    'mixcloud': { label: 'Mixcloud', description: 'DJ mixes & radio shows' },
    'beatport': { label: 'Beatport', description: 'Electronic music store' }
  };
  
  return platformInfo[platform] || { 
    label: platform.charAt(0).toUpperCase() + platform.slice(1), 
    description: '' 
  };
};

const EnhancedAddPlatformMenu: React.FC<EnhancedAddPlatformMenuProps> = ({
  open,
  availablePlatforms,
  onAddPlatform,
  onClose
}) => {
  // Prioritize platforms in the user's specified order (excluding defaults which are already shown)
  const priorityOrder = [
    'instagram', 'soundcloud', 'email', 'spotify', 'youtube','facebook',
  ];
  
  const sortedPlatforms = [...availablePlatforms].sort((a, b) => {
    const aIndex = priorityOrder.indexOf(a);
    const bIndex = priorityOrder.indexOf(b);
    
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });

  return (
    <PortfolioDialog
      open={open}
      onOpenChange={onClose}
      title="Add Social Platform"
      className="max-w-md"
    >
      <div className="max-h-96 overflow-y-auto">
        <div className="space-y-2">
          {sortedPlatforms.map((platform) => {
            const { label, description } = getPlatformInfo(platform);
            return (
              <button
                key={platform}
                onClick={() => {
                  onAddPlatform(platform);
                  onClose();
                }}
                className="flex items-center gap-3 p-3 rounded-lg text-left w-full transition-colors duration-200 hover:bg-gray-100 text-gray-900"
              >
                <div className="transition-colors duration-200 text-gray-600">
                  {getSocialIcon(platform)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900">
                    {label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        
        {availablePlatforms.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-600">
            All platforms have been added
          </div>
        )}
      </div>
    </PortfolioDialog>
  );
};

export default EnhancedAddPlatformMenu;
