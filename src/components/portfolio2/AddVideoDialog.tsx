import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { useUserProfile } from '@/hooks/useUserProfile';
import PortfolioDialog from './PortfolioDialog';

interface AddVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVideoAdded: () => void;
  sectionId?: string;
}

const AddVideoDialog: React.FC<AddVideoDialogProps> = ({
  open,
  onOpenChange,
  onVideoAdded,
  sectionId
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    videoUrl: ''
  });

  const validateVideoUrl = (url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]+/;
    const vimeoRegex = /^(https?:\/\/)?(www\.)?(vimeo\.com\/)[0-9]+/;
    
    return youtubeRegex.test(url) || vimeoRegex.test(url);
  };

  const getDefaultVideoTitle = (url: string): string => {
    const lowerCaseUrl = url.toLowerCase();

    if (lowerCaseUrl.includes('youtu')) {
      return 'YouTube Video';
    }

    if (lowerCaseUrl.includes('vimeo')) {
      return 'Vimeo Video';
    }

    return 'Video';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedVideoUrl = formData.videoUrl.trim();
    
    if (!trimmedVideoUrl) {
      toast({
        title: 'Error',
        description: 'Please enter a video URL',
        variant: 'destructive'
      });
      return;
    }

    if (!validateVideoUrl(trimmedVideoUrl)) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid YouTube or Vimeo URL',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Get the highest display order
      const { data: existingVideos, error: existingVideosError } = await supabase
        .from('portfolio_videos')
        .select('display_order')
        .eq('user_id', user.id)
        .order('display_order', { ascending: false })
        .limit(1);

      if (existingVideosError) throw existingVideosError;

      const nextOrder = existingVideos && existingVideos.length > 0 
        ? (existingVideos[0].display_order || 0) + 1 
        : 0;

      const { error } = await supabase
        .from('portfolio_videos')
        .insert({
          user_id: user.id,
          video_url: trimmedVideoUrl,
          title: getDefaultVideoTitle(trimmedVideoUrl),
          display_order: nextOrder,
          section_id: sectionId || null,
          username: profile?.username || null
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Video added successfully!'
      });

      setFormData({ videoUrl: '' });
      await Promise.resolve(onVideoAdded());
      onOpenChange(false);

    } catch (error: any) {
      console.error('Error adding video:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add video',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ videoUrl: '' });
      onOpenChange(false);
    }
  };

  return (
    <PortfolioDialog
      open={open}
      onOpenChange={handleClose}
      title="Add Video"
      className="max-w-md w-full"
    >

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label 
              htmlFor="videoUrl"
              className="text-sm font-medium text-foreground"
            >
              Video URL *
            </Label>
            <Input
              id="videoUrl"
              type="url"
              value={formData.videoUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
              placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
              disabled={isSubmitting}
              className="focus:ring-2"
            />
            <p className="text-xs text-muted-foreground">
              Supports YouTube and Vimeo URLs
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                  Adding...
                </>
              ) : (
                'Add Video'
              )}
            </Button>
          </div>
        </form>
    </PortfolioDialog>
  );
};

export default AddVideoDialog;
