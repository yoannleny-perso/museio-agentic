import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Share } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { usePortfolioData } from '@/context/PortfolioDataContext';
import SharePortfolioDialog from './SharePortfolioDialog';

const PortfolioHeaderControls: React.FC = () => {
  const { profile } = useUserProfile();
  const { data, updateData } = usePortfolioData();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const handleToggle = async (checked: boolean) => {
    await updateData({ is_public: checked });
  };

  if (!profile?.username) {
    return (
      <div className="text-sm text-muted-foreground">
        Set a username in settings to enable publishing
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="portfolio-toggle" className="text-sm font-medium">
        {data?.is_public ? 'Public' : 'Private'}
      </label>
      <Switch
        id="portfolio-toggle"
        checked={data?.is_public || false}
        onCheckedChange={handleToggle}
      />
      {data?.is_public && (
        <span className="text-xs text-muted-foreground bg-green-100 text-green-800 px-2 py-1 rounded">
          Live
        </span>
      )}
      {data?.is_public && profile?.username && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsShareDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Share className="w-4 h-4" />
          Share
        </Button>
      )}
      
      {profile?.username && (
        <SharePortfolioDialog
          isOpen={isShareDialogOpen}
          onClose={() => setIsShareDialogOpen(false)}
          username={profile.username}
        />
      )}
    </div>
  );
};

export default PortfolioHeaderControls;