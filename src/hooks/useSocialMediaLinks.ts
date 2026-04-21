
import { useSocialMediaLinksContext } from '@/contexts/SocialMediaLinksContext';

// Re-export the interface for backward compatibility
export type { SocialMediaLink } from '@/contexts/SocialMediaLinksContext';

export const useSocialMediaLinks = () => {
  const context = useSocialMediaLinksContext();
  return {
    ...context,
    // Sort social links by order for display
    socialLinks: [...context.socialLinks].sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
  };
};
