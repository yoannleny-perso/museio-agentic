
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, ExternalLink } from 'lucide-react';
import { getSocialIcon } from './socialIconMap';
import { toast } from 'sonner';
import PortfolioDialog from '../PortfolioDialog';

interface SocialMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: string;
  currentUrl: string;
  onSave: (url: string) => void;
  onDelete: () => void;
  isNewPlatform?: boolean;
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

const SocialMediaModal: React.FC<SocialMediaModalProps> = ({
  isOpen,
  onClose,
  platform,
  currentUrl,
  onSave,
  onDelete,
  isNewPlatform = false
}) => {
  const [url, setUrl] = useState(currentUrl);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setUrl(currentUrl);
  }, [currentUrl, isOpen]);

  const handleSave = async () => {
    if (!url.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    try {
      new URL(url);
    } catch {
      toast.error('Please enter a valid URL (include https://)');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(url.trim());
      toast.success(`${getPlatformLabel(platform)} link ${isNewPlatform ? 'added' : 'updated'} successfully`);
      onClose();
    } catch (error) {
      toast.error('Failed to save link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete();
      toast.success(`${getPlatformLabel(platform)} link removed`);
      onClose();
    } catch (error) {
      toast.error('Failed to remove link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <PortfolioDialog
      open={isOpen}
      onOpenChange={onClose}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="text-blue-600">
          {getSocialIcon(platform)}
        </div>
        <span className="text-lg font-semibold text-gray-900">
          {isNewPlatform ? 'Add' : 'Edit'} {getPlatformLabel(platform)} Link
        </span>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="url" className="text-gray-900">URL</Label>
          <Input
            id="url"
            type="url"
            placeholder={`Enter your ${getPlatformLabel(platform)} link`}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>

        {url && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ExternalLink className="h-4 w-4" />
            <span>Preview: Opens in new tab</span>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button 
            onClick={handleSave} 
            disabled={isLoading || !url.trim()}
            className="flex-1"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
          
          {!isNewPlatform && (
            <Button 
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </div>
    </PortfolioDialog>
  );
};

export default SocialMediaModal;
