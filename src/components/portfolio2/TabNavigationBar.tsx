import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';
import { useModedPortfolioSections } from '@/hooks/useModedPortfolioSections';
import { usePortfolioMode } from '@/context/PortfolioModeContext';
import { useModedPortfolioData } from '@/context/PortfolioDataContextModed';
import { BUILT_IN_SECTION_IDS } from '@/hooks/useModedPortfolioSections';
import { useIsMobile } from '@/hooks/use-mobile';

interface TabNavigationBarProps {
  onSectionClick: (section: string) => void;
}

const TabNavigationBar: React.FC<TabNavigationBarProps> = ({ onSectionClick }) => {
  const { themeColors } = usePortfolioTheme();
  const { sections, getSectionTitle } = useModedPortfolioSections();
  const { mode } = usePortfolioMode();
  const isMobile = useIsMobile();
  const { featuredCards, photos, videos, musicReleases, events } = useModedPortfolioData();
  const [activeTab, setActiveTab] = useState('featured');
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  const sectionHasContent = (sectionKey: string): boolean => {
    const config = sections.section_configs[sectionKey];
    
    switch (sectionKey) {
      case BUILT_IN_SECTION_IDS.videos:
        return videos.filter(v => v.section_id === sectionKey && v.is_enabled).length > 0;
      case BUILT_IN_SECTION_IDS.releases:
        return musicReleases.filter(r => r.section_id === sectionKey && r.is_enabled).length > 0;
      case BUILT_IN_SECTION_IDS.photos:
        return photos.filter(p => p.section_id === sectionKey).length > 0;
      case BUILT_IN_SECTION_IDS.events:
        return events.filter(e => e.section_id === sectionKey && e.is_enabled).length > 0;
      case BUILT_IN_SECTION_IDS.featured_cards:
        return featuredCards.filter(c => c.section_id === sectionKey && c.is_enabled).length > 0;
      case BUILT_IN_SECTION_IDS.hero:
      case BUILT_IN_SECTION_IDS.bio:
        return true; // Always show hero and bio sections
      default:
        // For custom sections, check by section type
        if (config?.type) {
          switch (config.type) {
            case 'VideoCarouselSection':
              return videos.filter(v => v.section_id === sectionKey && v.is_enabled).length > 0;
            case 'FeaturedReleaseList':
              return musicReleases.filter(r => r.section_id === sectionKey && r.is_enabled).length > 0;
            case 'PhotoGalleryCarousel':
              return photos.filter(p => p.section_id === sectionKey).length > 0;
            case 'NextShowCarousel':
              return events.filter(e => e.section_id === sectionKey && e.is_enabled).length > 0;
            case 'FeaturedPromoCards':
              return featuredCards.filter(c => c.section_id === sectionKey && c.is_enabled).length > 0;
            case 'BookMeSection':
              return true; // BookMe section always has content (the button)
            default:
              return false; // Hide unknown custom sections if empty
          }
        }
        return false; // Hide unknown sections by default
    }
  };

  // Generate tabs dynamically from portfolio sections
  // Filter to show only optional sections (isOptional: true) that are enabled
  // In live mode, also check if section has content
  const tabs = sections.section_order
    .filter(sectionKey => 
      sections.enabled_sections[sectionKey] && 
      sections.section_configs[sectionKey]?.isOptional === true &&
      (mode === 'edit' || sectionHasContent(sectionKey))
    )
    .map(sectionKey => ({
      id: sectionKey,
      label: getSectionTitle(sectionKey)
    }));

  const updateScrollState = () => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const handleScrollLeft = () => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: -100, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: 100, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    updateScrollState();
    const handleResize = () => updateScrollState();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set initial active tab when tabs change
  useEffect(() => {
    if (tabs.length > 0 && !tabs.find(tab => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  useEffect(() => {
    const sectionElements = tabs.map(tab => document.getElementById(tab.id)).filter(Boolean);
    
    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            setActiveTab(entry.target.id);
          }
        });
      },
      {
        threshold: 0.5,
        rootMargin: '0px 0px -50% 0px'
      }
    );

    sectionElements.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [tabs]);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onSectionClick(tabId);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (tabsRef.current) {
      const touch = e.touches[0];
      tabsRef.current.dataset.startX = touch.clientX.toString();
      tabsRef.current.dataset.scrollLeft = tabsRef.current.scrollLeft.toString();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (tabsRef.current && tabsRef.current.dataset.startX) {
      const touch = e.touches[0];
      const startX = parseInt(tabsRef.current.dataset.startX);
      const scrollLeft = parseInt(tabsRef.current.dataset.scrollLeft || '0');
      const diff = startX - touch.clientX;
      tabsRef.current.scrollLeft = scrollLeft + diff;
    }
  };

  const handleScroll = () => {
    updateScrollState();
  };

  // Hide the entire navigation bar if there are no tabs to show
  if (tabs.length === 0) {
    return null;
  }

  const isDesktopLiveCard = mode === 'live' && !isMobile;

  if (isDesktopLiveCard) {
    return (
      <div className="border-b border-white/10 pb-3">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-2 text-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className="text-[12px] font-semibold tracking-[-0.01em] transition-colors"
              style={{
                color: activeTab === tab.id ? '#FFFFFF' : 'rgba(248,250,252,0.68)',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = '#FFFFFF';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = 'rgba(248,250,252,0.68)';
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{ borderBottom: `1px solid ${themeColors.border}` }}
    >
      <div className="mx-auto" style={{ maxWidth: '400px' }}>
        <div className="flex items-center">
          {/* Left Arrow */}
          <button
            onClick={handleScrollLeft}
            disabled={!canScrollLeft}
            className="flex-shrink-0 p-2 transition-colors"
            style={{
              color: canScrollLeft ? themeColors.textSecondary : `${themeColors.textSecondary}50`,
              cursor: canScrollLeft ? 'pointer' : 'not-allowed',
              minWidth: '40px'
            }}
            onMouseEnter={(e) => {
              if (canScrollLeft) {
                e.currentTarget.style.color = themeColors.primary;
                e.currentTarget.style.backgroundColor = `${themeColors.primary}10`;
              }
            }}
            onMouseLeave={(e) => {
              if (canScrollLeft) {
                e.currentTarget.style.color = themeColors.textSecondary;
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Scrollable Tabs Container */}
          <div 
            ref={tabsRef}
            className="flex overflow-x-auto scrollbar-hide py-3 px-2 flex-1"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onScroll={handleScroll}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className="flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-full mr-3 transition-all duration-200 touch-manipulation min-w-[60px]"
                style={{
                  backgroundColor: activeTab === tab.id ? themeColors.primary : 'transparent',
                  color: activeTab === tab.id ? '#FFFFFF' : themeColors.textSecondary,
                  minHeight: '32px',
                  boxShadow: activeTab === tab.id ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = themeColors.primary;
                    e.currentTarget.style.backgroundColor = `${themeColors.primary}10`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = themeColors.textSecondary;
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={handleScrollRight}
            disabled={!canScrollRight}
            className="flex-shrink-0 p-2 transition-colors"
            style={{
              color: canScrollRight ? themeColors.textSecondary : `${themeColors.textSecondary}50`,
              cursor: canScrollRight ? 'pointer' : 'not-allowed',
              minWidth: '40px'
            }}
            onMouseEnter={(e) => {
              if (canScrollRight) {
                e.currentTarget.style.color = themeColors.primary;
                e.currentTarget.style.backgroundColor = `${themeColors.primary}10`;
              }
            }}
            onMouseLeave={(e) => {
              if (canScrollRight) {
                e.currentTarget.style.color = themeColors.textSecondary;
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TabNavigationBar;
