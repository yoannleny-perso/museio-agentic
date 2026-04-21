import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SocialMediaLink } from '@/hooks/useSocialMediaLinks';

interface UseLiveSocialMediaLinksProps {
  username?: string;
}

export const useLiveSocialMediaLinks = ({ username }: UseLiveSocialMediaLinksProps) => {
  const [socialLinks, setSocialLinks] = useState<SocialMediaLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSocialLinks = async () => {
      if (!username) {
        setLoading(false);
        return;
      }

      try {
        // Fetch social links by username first
        const { data, error } = await supabase
          .from('portfolio_settings')
          .select('social_links')
          .eq('username', username)
          .eq('is_public', true)
          .maybeSingle();

        if (error) {
          console.error('Error fetching social links:', error);
          setSocialLinks([]);
          return;
        }

        if (data?.social_links && Array.isArray(data.social_links)) {
          const links = data.social_links as unknown as SocialMediaLink[];
          setSocialLinks(links);
        } else {
          setSocialLinks([]);
        }
      } catch (error) {
        console.error('Error fetching social links:', error);
        setSocialLinks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSocialLinks();
  }, [username]);

  // Sort social links by order for display - same logic as the main hook
  const sortedSocialLinks = useMemo(() => {
    return [...socialLinks].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }, [socialLinks]);

  return {
    socialLinks: sortedSocialLinks,
    loading,
    // Read-only mode - no update functions
    updateSocialLink: undefined,
    saveSocialLinks: undefined,
    reorderSocialLinks: undefined
  };
};