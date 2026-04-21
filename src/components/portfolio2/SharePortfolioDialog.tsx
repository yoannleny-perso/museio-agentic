import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { buildAbsoluteUrl, buildPortfolioRoute, DEFAULT_MARKETING_ORIGIN } from '@/contracts/routes';

interface SharePortfolioDialogProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

const SharePortfolioDialog: React.FC<SharePortfolioDialogProps> = ({ 
  isOpen, 
  onClose, 
  username 
}) => {
  const [copied, setCopied] = useState(false);

  const portfolioUrl = buildAbsoluteUrl(
    buildPortfolioRoute(username),
    typeof window !== 'undefined' ? window.location.origin : DEFAULT_MARKETING_ORIGIN,
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(portfolioUrl);
      setCopied(true);
      toast.success('Portfolio link copied to clipboard!');
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link. Please try again.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Portfolio</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Share your live portfolio with this link:
          </p>
          
          <div className="flex items-center space-x-2">
            <div className="flex-1 p-3 bg-muted rounded-md border">
              <code className="text-sm break-all">{portfolioUrl}</code>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SharePortfolioDialog;
