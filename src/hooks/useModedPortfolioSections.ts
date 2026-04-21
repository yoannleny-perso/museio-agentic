
import { useState, useEffect, useRef } from 'react';
import { useModedPortfolioData } from '@/context/PortfolioDataContextModed';
import { usePortfolioMode } from '@/context/PortfolioModeContext';
import { supabase } from '@/integrations/supabase/client';

export interface SectionConfig {
  type?: 'FeaturedPromoCards' | 'FeaturedReleaseList' | 'VideoCarouselSection' | 'PhotoGalleryCarousel' | 'NextShowCarousel' | 'BookMeSection';
  custom_options?: Record<string, any>;
  isOptional?: boolean;
}

export interface PortfolioSections {
  section_order: string[];
  enabled_sections: Record<string, boolean>;
  section_titles: Record<string, string>;
  section_configs: Record<string, SectionConfig>;
}

// Fixed UUIDs for built-in sections to maintain consistency
export const BUILT_IN_SECTION_IDS = {
  hero: '00000000-0000-0000-0000-000000000001',
  bio: '00000000-0000-0000-0000-000000000002',
  featured_cards: '00000000-0000-0000-0000-000000000003',
  videos: '00000000-0000-0000-0000-000000000004', 
  photos: '00000000-0000-0000-0000-000000000005',
  releases: '00000000-0000-0000-0000-000000000006',
  events: '00000000-0000-0000-0000-000000000007',
  book_me: '00000000-0000-0000-0000-000000000008',
};

const defaultSections: PortfolioSections = {
  section_order: [
    BUILT_IN_SECTION_IDS.book_me,
    BUILT_IN_SECTION_IDS.featured_cards,
    BUILT_IN_SECTION_IDS.videos,
    BUILT_IN_SECTION_IDS.photos,
    BUILT_IN_SECTION_IDS.releases,
    BUILT_IN_SECTION_IDS.events
  ],
  enabled_sections: {
    [BUILT_IN_SECTION_IDS.book_me]: true,
    [BUILT_IN_SECTION_IDS.featured_cards]: true,
    [BUILT_IN_SECTION_IDS.videos]: true,
    [BUILT_IN_SECTION_IDS.photos]: true,
    [BUILT_IN_SECTION_IDS.releases]: true,
    [BUILT_IN_SECTION_IDS.events]: true
  },
  section_titles: {},
  section_configs: {
    [BUILT_IN_SECTION_IDS.book_me]: { type: 'BookMeSection', isOptional: true },
    [BUILT_IN_SECTION_IDS.featured_cards]: { type: 'FeaturedPromoCards', isOptional: true },
    [BUILT_IN_SECTION_IDS.videos]: { type: 'VideoCarouselSection', isOptional: true },
    [BUILT_IN_SECTION_IDS.photos]: { type: 'PhotoGalleryCarousel', isOptional: true },
    [BUILT_IN_SECTION_IDS.releases]: { type: 'FeaturedReleaseList', isOptional: true },
    [BUILT_IN_SECTION_IDS.events]: { type: 'NextShowCarousel', isOptional: true }
  }
};

// Minimal defaults for when there's no existing configuration - only hero section enabled
const minimalDefaultSections: PortfolioSections = {
  section_order: [],
  enabled_sections: {
    [BUILT_IN_SECTION_IDS.hero]: true
  },
  section_titles: {},
  section_configs: {
    [BUILT_IN_SECTION_IDS.hero]: { isOptional: false }
  }
};

const defaultSectionTitles: Record<string, string> = {
  [BUILT_IN_SECTION_IDS.book_me]: 'Book Me',
  [BUILT_IN_SECTION_IDS.featured_cards]: 'Featured',
  [BUILT_IN_SECTION_IDS.videos]: 'Videos',
  [BUILT_IN_SECTION_IDS.photos]: 'Photos',
  [BUILT_IN_SECTION_IDS.releases]: 'Music',
  [BUILT_IN_SECTION_IDS.events]: 'Next Shows'
};

const builtInSections = [
  BUILT_IN_SECTION_IDS.hero, 
  BUILT_IN_SECTION_IDS.bio,
  BUILT_IN_SECTION_IDS.book_me,
  BUILT_IN_SECTION_IDS.featured_cards,
  BUILT_IN_SECTION_IDS.videos,
  BUILT_IN_SECTION_IDS.photos,
  BUILT_IN_SECTION_IDS.releases,
  BUILT_IN_SECTION_IDS.events
];

const LEGACY_SECTION_KEY_MAP: Record<string, string> = {
  hero: BUILT_IN_SECTION_IDS.hero,
  bio: BUILT_IN_SECTION_IDS.bio,
  featured_cards: BUILT_IN_SECTION_IDS.featured_cards,
  featured: BUILT_IN_SECTION_IDS.featured_cards,
  videos: BUILT_IN_SECTION_IDS.videos,
  photos: BUILT_IN_SECTION_IDS.photos,
  releases: BUILT_IN_SECTION_IDS.releases,
  music: BUILT_IN_SECTION_IDS.releases,
  events: BUILT_IN_SECTION_IDS.events,
  book_me: BUILT_IN_SECTION_IDS.book_me,
  bookMe: BUILT_IN_SECTION_IDS.book_me,
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeSectionKey = (sectionKey: string) =>
  LEGACY_SECTION_KEY_MAP[sectionKey] ?? sectionKey;

const getBuiltInFallbackConfig = (sectionKey: string): SectionConfig | undefined => {
  if (sectionKey === BUILT_IN_SECTION_IDS.hero || sectionKey === BUILT_IN_SECTION_IDS.bio) {
    return { isOptional: false };
  }

  return defaultSections.section_configs[sectionKey];
};

const normalizePortfolioSections = (
  rawSections: Partial<PortfolioSections> | null | undefined
): { normalized: PortfolioSections; changed: boolean } => {
  let changed = false;

  const normalizedOrder: string[] = [];
  if (Array.isArray(rawSections?.section_order)) {
    rawSections.section_order.forEach((sectionKey) => {
      if (typeof sectionKey !== 'string') {
        changed = true;
        return;
      }

      const normalizedKey = normalizeSectionKey(sectionKey);
      if (normalizedKey !== sectionKey) {
        changed = true;
      }

      if (!normalizedOrder.includes(normalizedKey)) {
        normalizedOrder.push(normalizedKey);
      } else {
        changed = true;
      }
    });
  }

  const normalizedEnabled: Record<string, boolean> = {};
  if (isPlainObject(rawSections?.enabled_sections)) {
    Object.entries(rawSections.enabled_sections).forEach(([sectionKey, isEnabled]) => {
      const normalizedKey = normalizeSectionKey(sectionKey);
      if (normalizedKey !== sectionKey) {
        changed = true;
      }
      normalizedEnabled[normalizedKey] = Boolean(isEnabled);
    });
  }

  const normalizedTitles: Record<string, string> = {};
  if (isPlainObject(rawSections?.section_titles)) {
    Object.entries(rawSections.section_titles).forEach(([sectionKey, title]) => {
      const normalizedKey = normalizeSectionKey(sectionKey);
      if (normalizedKey !== sectionKey) {
        changed = true;
      }

      if (typeof title === 'string') {
        normalizedTitles[normalizedKey] = title;
      }
    });
  }

  const normalizedConfigs: Record<string, SectionConfig> = {};
  if (isPlainObject(rawSections?.section_configs)) {
    Object.entries(rawSections.section_configs).forEach(([sectionKey, config]) => {
      const normalizedKey = normalizeSectionKey(sectionKey);
      if (normalizedKey !== sectionKey) {
        changed = true;
      }

      if (isPlainObject(config)) {
        normalizedConfigs[normalizedKey] = config as SectionConfig;
      }
    });
  }

  const referencedSectionKeys = new Set([
    ...normalizedOrder,
    ...Object.keys(normalizedEnabled),
    ...Object.keys(normalizedTitles),
    ...Object.keys(normalizedConfigs),
  ]);

  builtInSections.forEach((sectionKey) => {
    if (!referencedSectionKeys.has(sectionKey)) {
      return;
    }

    if (!normalizedConfigs[sectionKey]) {
      const fallbackConfig = getBuiltInFallbackConfig(sectionKey);
      if (fallbackConfig) {
        normalizedConfigs[sectionKey] = fallbackConfig;
        changed = true;
      }
    }
  });

  return {
    normalized: {
      section_order: normalizedOrder,
      enabled_sections: normalizedEnabled,
      section_titles: normalizedTitles,
      section_configs: normalizedConfigs,
    },
    changed,
  };
};

export const useModedPortfolioSections = () => {
  const {
    data,
    loading: dataLoading,
    updateData,
    refetch,
    refetchFeaturedCards,
    refetchVideos,
    refetchMusicReleases,
    refetchEvents,
  } = useModedPortfolioData();
  const { mode } = usePortfolioMode();
  const [sections, setSections] = useState<PortfolioSections>(minimalDefaultSections);
  const hasInitialized = useRef(false);
  
  // Get content hooks for cache invalidation (only in edit mode)
  const isEditMode = mode === 'edit';

  // Load sections from database with fallback to defaults
  useEffect(() => {
    if (data && !hasInitialized.current) {
      const hasAnySectionConfiguration =
        Array.isArray(data.section_order) ||
        isPlainObject(data.enabled_sections) ||
        isPlainObject(data.section_titles) ||
        isPlainObject(data.section_configs);
      
      if (!hasAnySectionConfiguration && isEditMode && updateData) {
        // 1. Use default configuration
        // 2. Save default configuration to database
        // 3. Database will reload automatically via context
        updateData({
          section_order: minimalDefaultSections.section_order as any,
          enabled_sections: minimalDefaultSections.enabled_sections as any,
          section_titles: minimalDefaultSections.section_titles as any,
          section_configs: minimalDefaultSections.section_configs as any
        }).then((success) => {
          if (success) {
            // Trigger refetch to reload from database
            refetch();
          }
        });
      } else {
        const { normalized, changed } = normalizePortfolioSections({
          section_order: Array.isArray(data.section_order) ? (data.section_order as unknown as string[]) : [],
          enabled_sections: isPlainObject(data.enabled_sections) ? (data.enabled_sections as unknown as Record<string, boolean>) : {},
          section_titles: isPlainObject(data.section_titles) ? (data.section_titles as unknown as Record<string, string>) : {},
          section_configs: isPlainObject(data.section_configs) ? (data.section_configs as unknown as Record<string, SectionConfig>) : {},
        });

        setSections(normalized);

        if (changed && isEditMode && updateData) {
          void updateData({
            section_order: normalized.section_order as any,
            enabled_sections: normalized.enabled_sections as any,
            section_titles: normalized.section_titles as any,
            section_configs: normalized.section_configs as any,
          });
        }
      }
      
      hasInitialized.current = true;
    }
  }, [data, isEditMode, updateData, refetch]);

  // Update local state when data changes (including after database updates)
  useEffect(() => {
    if (data && hasInitialized.current) {
      const { normalized } = normalizePortfolioSections({
        section_order: Array.isArray(data.section_order) ? (data.section_order as unknown as string[]) : [],
        enabled_sections: isPlainObject(data.enabled_sections) ? (data.enabled_sections as unknown as Record<string, boolean>) : {},
        section_titles: isPlainObject(data.section_titles) ? (data.section_titles as unknown as Record<string, string>) : {},
        section_configs: isPlainObject(data.section_configs) ? (data.section_configs as unknown as Record<string, SectionConfig>) : {},
      });

      setSections(normalized);
    }
  }, [data]);

  const updateSections = async (updates: Partial<PortfolioSections>) => {
    // In live mode, don't allow updates
    if (!isEditMode || !updateData) {
      return false;
    }

    try {
      const newSections = { ...sections, ...updates };
      
      const success = await updateData({
        section_order: newSections.section_order as any,
        enabled_sections: newSections.enabled_sections as any,
        section_titles: newSections.section_titles as any,
        section_configs: newSections.section_configs as any
      });

      if (success) {
        // Force refetch to ensure fresh data and eliminate race conditions
        await refetch();
      }
      
      return success;
    } catch (error) {
      console.error('Error updating sections:', error);
      return false;
    }
  };

  const getSectionTitle = (sectionKey: string): string => {
    return sections.section_titles[sectionKey] || defaultSectionTitles[sectionKey] || sectionKey;
  };

  const updateSectionTitle = async (sectionKey: string, title: string) => {
    if (!isEditMode) return false;
    const newTitles = { ...sections.section_titles, [sectionKey]: title };
    return await updateSections({ section_titles: newTitles });
  };

  // Helper function to generate UUID-based section key
  const generateSectionKey = (type: SectionConfig['type']) => {
    return crypto.randomUUID();
  };

  // Helper function to determine if a section should be optional
  const shouldSectionBeOptional = (type: SectionConfig['type']) => {
    // All custom sections (added through addSection) should be optional
    return true;
  };

  // Helper function to generate default title based on type
  const generateDefaultTitle = (type: SectionConfig['type']) => {
    // Count existing sections of the same type to generate numbered title
    const existingSectionsOfType = Object.entries(sections.section_configs)
      .filter(([_, config]) => config.type === type);
    const nextNumber = existingSectionsOfType.length + 1;
    
    const typeMap: Record<SectionConfig['type'], string> = {
      'FeaturedPromoCards': 'Featured Cards',
      'FeaturedReleaseList': 'Featured Releases', 
      'VideoCarouselSection': 'Video Gallery',
      'PhotoGalleryCarousel': 'Photo Gallery',
      'NextShowCarousel': 'Next Shows',
      'BookMeSection': 'Book Me'
    };
    
    const baseName = typeMap[type] || type;
    return nextNumber === 1 ? baseName : `${baseName} ${nextNumber}`;
  };

  const addSection = async (type: SectionConfig['type']) => {
    if (!isEditMode) return false;

    try {
      const newSectionKey = generateSectionKey(type);
      const defaultTitle = generateDefaultTitle(type);
      
      const newSectionOrder = [...sections.section_order, newSectionKey];
      const newEnabledSections = { ...sections.enabled_sections, [newSectionKey]: true };
      const newSectionConfigs = { ...sections.section_configs, [newSectionKey]: { type, isOptional: shouldSectionBeOptional(type) } };
      const newSectionTitles = { ...sections.section_titles, [newSectionKey]: defaultTitle };
      
      // Optimistic local update so UI reflects immediately
      setSections({
        section_order: newSectionOrder,
        enabled_sections: newEnabledSections,
        section_configs: newSectionConfigs,
        section_titles: newSectionTitles,
      });
      
      const success = await updateData({
        section_order: newSectionOrder as any,
        enabled_sections: newEnabledSections as any,
        section_configs: newSectionConfigs as any,
        section_titles: newSectionTitles as any
      });

      if (success) {
        // Refresh content to clear any stale cached data
        refreshContentForSectionType(type);
        // Force refetch to ensure fresh data
        await refetch();
      } else {
        // Revert optimistic state by refetching
        await refetch();
      }

      return success;
    } catch (error) {
      console.error('Error adding section:', error);
      await refetch();
      return false;
    }
  };

  const removeSection = async (sectionKey: string) => {
    if (!isEditMode) return false;

    const isBuiltIn = builtInSections.includes(sectionKey);
    
    try {
      if (isBuiltIn) {
        // For built-in sections, just disable them
        const newEnabledSections = { ...sections.enabled_sections, [sectionKey]: false };
        const success = await updateData({
          section_order: sections.section_order as any,
          enabled_sections: newEnabledSections as any,
          section_titles: sections.section_titles as any,
          section_configs: sections.section_configs as any
        });
        
        if (success) {
          // Force refetch to ensure fresh data
          await refetch();
        }
        
        return success;
      } else {
        // For custom sections: 1. Delete content, 2. Update sections, 3. Refetch
        const sectionConfig = sections.section_configs[sectionKey];
        
        // Step 1: Delete associated content first and wait for completion
        if (sectionConfig) {
          await deleteContentForSectionType(sectionConfig.type);
        }
        
        // Step 2: Remove section from configuration
        const newSectionOrder = sections.section_order.filter(key => key !== sectionKey);
        const newEnabledSections = { ...sections.enabled_sections };
        const newSectionTitles = { ...sections.section_titles };
        const newSectionConfigs = { ...sections.section_configs };
        
        delete newEnabledSections[sectionKey];
        delete newSectionTitles[sectionKey];
        delete newSectionConfigs[sectionKey];
        
        const success = await updateData({
          section_order: newSectionOrder as any,
          enabled_sections: newEnabledSections as any,
          section_titles: newSectionTitles as any,
          section_configs: newSectionConfigs as any
        });

        // Step 3: Force refetch to ensure fresh data
        if (success) {
          await refetch();
        }

        return success;
      }
    } catch (error) {
      console.error('Error removing section:', error);
      return false;
    }
  };

  const refreshContentForSectionType = (sectionType: SectionConfig['type']) => {
    if (!isEditMode) return;

    switch (sectionType) {
      case 'FeaturedPromoCards':
        void refetchFeaturedCards();
        break;
      case 'VideoCarouselSection':
        void refetchVideos();
        break;
      case 'PhotoGalleryCarousel':
        // No specific photos hook, content will refresh on next page load
        break;
      case 'FeaturedReleaseList':
        void refetchMusicReleases();
        break;
      case 'NextShowCarousel':
        void refetchEvents();
        break;
      case 'BookMeSection':
        // BookMe section doesn't have associated content to refresh
        break;
    }
  };

  const deleteContentForSectionType = async (sectionType: SectionConfig['type']) => {
    if (!isEditMode) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      switch (sectionType) {
        case 'FeaturedPromoCards':
          await supabase
            .from('portfolio_featured_cards')
            .delete()
            .eq('user_id', user.id);
          break;
        case 'VideoCarouselSection':
          await supabase
            .from('portfolio_videos')
            .delete()
            .eq('user_id', user.id);
          break;
        case 'PhotoGalleryCarousel':
          await supabase
            .from('portfolio_photos')
            .delete()
            .eq('user_id', user.id)
            .neq('display_order', 0); // Keep header photo
          break;
        case 'FeaturedReleaseList':
          await supabase
            .from('portfolio_music_releases')
            .delete()
            .eq('user_id', user.id);
          break;
        case 'NextShowCarousel':
          await supabase
            .from('portfolio_events')
            .delete()
            .eq('user_id', user.id);
          break;
        case 'BookMeSection':
          // BookMe section doesn't have associated content to delete
          break;
      }
      
      // Refresh the content to clear cached data
      refreshContentForSectionType(sectionType);
    } catch (error) {
      console.error(`Error deleting content for section type ${sectionType}:`, error);
    }
  };

  const toggleSection = async (sectionKey: string) => {
    if (!isEditMode) return false;

    try {
      const newEnabledSections = {
        ...sections.enabled_sections,
        [sectionKey]: !sections.enabled_sections[sectionKey]
      };
      
      const success = await updateData({
        section_order: sections.section_order as any,
        enabled_sections: newEnabledSections as any,
        section_titles: sections.section_titles as any,
        section_configs: sections.section_configs as any
      });

      if (success) {
        // Force refetch to ensure fresh data
        await refetch();
      }

      return success;
    } catch (error) {
      console.error('Error toggling section:', error);
      return false;
    }
  };

  const isBuiltInSection = (sectionKey: string) => {
    return builtInSections.includes(sectionKey);
  };

  const moveSectionUp = async (sectionKey: string) => {
    if (!isEditMode) return false;

    const currentIndex = sections.section_order.indexOf(sectionKey);
    if (currentIndex <= 0) return false; // Can't move first item up
    
    const newOrder = [...sections.section_order];
    [newOrder[currentIndex], newOrder[currentIndex - 1]] = [newOrder[currentIndex - 1], newOrder[currentIndex]];
    
    return await updateSections({ section_order: newOrder });
  };

  const moveSectionDown = async (sectionKey: string) => {
    if (!isEditMode) return false;

    const currentIndex = sections.section_order.indexOf(sectionKey);
    if (currentIndex < 0 || currentIndex >= sections.section_order.length - 1) return false; // Can't move last item down
    
    const newOrder = [...sections.section_order];
    [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
    
    return await updateSections({ section_order: newOrder });
  };

  const reorderSections = async (fromSectionKey: string, toSectionKey: string) => {
    if (!isEditMode) return false;
    if (fromSectionKey === toSectionKey) return false;

    const fromIndex = sections.section_order.indexOf(fromSectionKey);
    const toIndex = sections.section_order.indexOf(toSectionKey);

    if (fromIndex === -1 || toIndex === -1) {
      return false;
    }

    const newOrder = [...sections.section_order];
    const [movedSection] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedSection);
    
    return await updateSections({ section_order: newOrder });
  };

  const canMoveSectionUp = (sectionKey: string) => {
    const currentIndex = sections.section_order.indexOf(sectionKey);
    return currentIndex > 0;
  };

  const canMoveSectionDown = (sectionKey: string) => {
    const currentIndex = sections.section_order.indexOf(sectionKey);
    return currentIndex >= 0 && currentIndex < sections.section_order.length - 1;
  };

  return {
    sections,
    loading: dataLoading,
    getSectionTitle,
    updateSectionTitle,
    addSection,
    removeSection,
    toggleSection,
    updateSections,
    isBuiltInSection,
    moveSectionUp,
    moveSectionDown,
    reorderSections,
    canMoveSectionUp,
    canMoveSectionDown,
    BUILT_IN_SECTION_IDS
  };
};
