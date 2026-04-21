
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SocialMediaLink {
  platform: string;
  url: string;
  enabled: boolean;
  order?: number;
}

interface SocialMediaLinksContextType {
  socialLinks: SocialMediaLink[];
  loading: boolean;
  saving: boolean;
  updateSocialLink: (platform: string, updates: Partial<SocialMediaLink>) => void;
  saveSocialLinks: (links: SocialMediaLink[]) => Promise<void>;
  reorderSocialLinks: (oldIndex: number, newIndex: number) => Promise<void>;
}

const SocialMediaLinksContext = createContext<SocialMediaLinksContextType | undefined>(undefined);

export const useSocialMediaLinksContext = () => {
  const context = useContext(SocialMediaLinksContext);
  if (context === undefined) {
    throw new Error('useSocialMediaLinksContext must be used within a SocialMediaLinksProvider');
  }
  return context;
};

interface SocialMediaLinksProviderProps {
  children: ReactNode;
}

export const SocialMediaLinksProvider: React.FC<SocialMediaLinksProviderProps> = ({ children }) => {
  const [socialLinks, setSocialLinks] = useState<SocialMediaLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // All platforms start as disabled - no special "default" platforms
  const availablePlatforms = [
    { platform: 'instagram', url: '', enabled: false, order: 0 },
    { platform: 'facebook', url: '', enabled: false, order: 1 },
    { platform: 'soundcloud', url: '', enabled: false, order: 2 },
    { platform: 'tiktok', url: '', enabled: false, order: 3 },
    { platform: 'youtube', url: '', enabled: false, order: 4 },
    { platform: 'spotify', url: '', enabled: false, order: 5 },
    { platform: 'apple-music', url: '', enabled: false, order: 6 },
    { platform: 'twitter', url: '', enabled: false, order: 7 },
    { platform: 'bandcamp', url: '', enabled: false, order: 8 },
    { platform: 'email', url: '', enabled: false, order: 9 },
    { platform: 'linkedin', url: '', enabled: false, order: 10 },
    { platform: 'discord', url: '', enabled: false, order: 11 },
    { platform: 'twitch', url: '', enabled: false, order: 12 },
    { platform: 'patreon', url: '', enabled: false, order: 13 },
    { platform: 'mixcloud', url: '', enabled: false, order: 14 },
    { platform: 'beatport', url: '', enabled: false, order: 15 },
  ];

  const fetchSocialLinks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('portfolio_settings')
        .select('social_links')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.social_links && Array.isArray(data.social_links)) {
        const existingSocialLinks = data.social_links as unknown as SocialMediaLink[];
        
        // Merge existing data with available platforms - PRIORITIZE EXISTING DATA
        const mergedLinks = availablePlatforms.map(defaultLink => {
          const existingLink = existingSocialLinks.find(link => link.platform === defaultLink.platform);
          if (existingLink) {
            // Preserve existing order if available, otherwise use default order
            return { ...existingLink, order: existingLink.order ?? defaultLink.order };
          }
          return defaultLink;
        });
        
        // Add any platforms that exist in user data but not in available platforms
        existingSocialLinks.forEach(existingLink => {
          if (!mergedLinks.find(link => link.platform === existingLink.platform)) {
            // Assign high order number for unknown platforms
            mergedLinks.push({ ...existingLink, order: existingLink.order ?? 999 });
          }
        });
        
        setSocialLinks(mergedLinks);
      } else {
        // First time user - set up with all platforms disabled
        setSocialLinks(availablePlatforms);
        await saveSocialLinksToDb(availablePlatforms);
      }
    } catch (error) {
      console.error('Error fetching social links:', error);
      setSocialLinks(availablePlatforms);
    } finally {
      setLoading(false);
    }
  };

  const saveSocialLinksToDb = async (links: SocialMediaLink[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('portfolio_settings')
      .upsert({
        user_id: user.id,
        social_links: links as unknown as any
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      throw error;
    }
  };

  const saveSocialLinks = async (links: SocialMediaLink[]) => {
    try {
      setSaving(true);
      await saveSocialLinksToDb(links);
      setSocialLinks(links);
      toast.success('Social links updated successfully');
    } catch (error) {
      console.error('Error saving social links:', error);
      toast.error('Failed to save social links');
    } finally {
      setSaving(false);
    }
  };

  const updateSocialLink = (platform: string, updates: Partial<SocialMediaLink>) => {
    const existingLinkIndex = socialLinks.findIndex(link => link.platform === platform);
    let updatedLinks: SocialMediaLink[];
    
    if (existingLinkIndex >= 0) {
      // Update existing platform
      updatedLinks = socialLinks.map(link =>
        link.platform === platform ? { ...link, ...updates } : link
      );
    } else {
      // Add new platform
      const defaultPlatform = availablePlatforms.find(p => p.platform === platform);
      const newLink: SocialMediaLink = {
        platform,
        url: updates.url || '',
        enabled: updates.enabled !== undefined ? updates.enabled : true,
        order: updates.order ?? defaultPlatform?.order ?? 999
      };
      updatedLinks = [...socialLinks, newLink];
    }
    
    setSocialLinks(updatedLinks);
    saveSocialLinks(updatedLinks);
  };

  const reorderSocialLinks = async (oldIndex: number, newIndex: number) => {
    const sortedLinks = [...socialLinks].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    // Only show links that are enabled AND have URLs
    const visibleLinks = sortedLinks.filter(link => link.enabled && link.url && link.url.trim());
    
    if (oldIndex >= 0 && oldIndex < visibleLinks.length && newIndex >= 0 && newIndex < visibleLinks.length) {
      const newVisibleOrder = [...visibleLinks];
      const [movedItem] = newVisibleOrder.splice(oldIndex, 1);
      newVisibleOrder.splice(newIndex, 0, movedItem);
      
      // Update order values for all visible items
      const updatedLinks = socialLinks.map(link => {
        const visibleIndex = newVisibleOrder.findIndex(v => v.platform === link.platform);
        if (visibleIndex !== -1) {
          return { ...link, order: visibleIndex };
        }
        return link;
      });
      
      setSocialLinks(updatedLinks);
      await saveSocialLinksToDb(updatedLinks);
    }
  };

  useEffect(() => {
    fetchSocialLinks();
  }, []);

  const value = {
    socialLinks,
    loading,
    saving,
    updateSocialLink,
    saveSocialLinks,
    reorderSocialLinks
  };

  return (
    <SocialMediaLinksContext.Provider value={value}>
      {children}
    </SocialMediaLinksContext.Provider>
  );
};
