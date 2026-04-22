
import React, { useCallback, useMemo, useState } from 'react';
import HeroHeader from '@/components/portfolio2/HeroHeader';
import DynamicSection from '@/components/portfolio2/DynamicSection';
import SectionSeparator from '@/components/portfolio2/SectionSeparator';
import BackgroundGradientSelector from '@/components/portfolio2/BackgroundGradientSelector';
import AddSectionButton from '@/components/portfolio2/AddSectionButton';
import PageFooter from '@/components/portfolio2/PageFooter';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';
import { useModedPortfolioSections, BUILT_IN_SECTION_IDS } from '@/hooks/useModedPortfolioSections';
import { useModedPortfolioData } from '@/context/PortfolioDataContextModed';
import { useIsMobile } from '@/hooks/use-mobile';
import { useModedPortfolioPhoto } from '@/hooks/useModedPortfolioPhoto';
import { Card } from '@/components/ui/card';
import { PortfolioMode } from '@/types/portfolio';
import { cn } from '@/lib/utils';
import { Capacitor } from '@capacitor/core';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PortfolioRendererProps {
  mode: PortfolioMode;
}

interface SortableSectionProps {
  sectionKey: string;
  disabled: boolean;
  children: (props: {
    dragHandleProps?: Record<string, any>;
    isDragging: boolean;
  }) => React.ReactNode;
}

const SortableSection: React.FC<SortableSectionProps> = ({
  sectionKey,
  disabled,
  children,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sectionKey,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'relative z-20' : undefined}
    >
      {children({
        dragHandleProps: disabled ? undefined : { ...attributes, ...listeners },
        isDragging,
      })}
    </div>
  );
};

interface EditableSectionsProps {
  sectionKeys: string[];
  reorderSections: (fromSectionKey: string, toSectionKey: string) => Promise<unknown>;
  renderSection: (
    sectionKey: string,
    sortableProps?: {
      dragHandleProps?: Record<string, any>;
      isDragging?: boolean;
    }
  ) => React.ReactNode;
}

const EditableSections: React.FC<EditableSectionsProps> = ({
  sectionKeys,
  reorderSections,
  renderSection,
}) => {
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [draggedOverSection, setDraggedOverSection] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const clearDragState = () => {
    setDraggedSection(null);
    setDraggedOverSection(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setDraggedSection(String(event.active.id));
    setDraggedOverSection(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setDraggedOverSection(event.over ? String(event.over.id) : null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const activeSectionKey = String(event.active.id);
    const overSectionKey = event.over ? String(event.over.id) : null;

    if (overSectionKey && activeSectionKey !== overSectionKey) {
      const isKnownActive = sectionKeys.includes(activeSectionKey);
      const isKnownOver = sectionKeys.includes(overSectionKey);

      if (isKnownActive && isKnownOver) {
        await reorderSections(activeSectionKey, overSectionKey);
      }
    }

    clearDragState();
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={clearDragState}
    >
      <SortableContext
        items={sectionKeys}
        strategy={verticalListSortingStrategy}
      >
        {sectionKeys.map((sectionKey) => (
          <SortableSection
            key={sectionKey}
            sectionKey={sectionKey}
            disabled={false}
          >
            {(sortableProps) =>
              renderSection(sectionKey, {
                ...sortableProps,
                isDragging: sortableProps.isDragging ?? false,
                dragHandleProps: sortableProps.dragHandleProps,
              })
            }
          </SortableSection>
        ))}
      </SortableContext>
    </DndContext>
  );
};

const PortfolioRenderer: React.FC<PortfolioRendererProps> = ({ mode }) => {
  const { themeColors, layoutPreferences, getCurrentGradient } = usePortfolioTheme();
  const { sections, loading: sectionsLoading, getSectionTitle, reorderSections } = useModedPortfolioSections();
  const { featuredCards, photos, videos, musicReleases, events } = useModedPortfolioData();
  const { headerPhoto } = useModedPortfolioPhoto();
  const isMobile = useIsMobile();

  const isEditMode = mode === 'edit';
  const isLiveMode = mode === 'live';
  const isDesktopLiveCard = isLiveMode && !isMobile && !Capacitor.isNativePlatform();

  // Determine container styling based on mode and screen size
  const getContainerMaxWidth = () => {
    return '100%';
  };

  const getContainerPadding = () => {
    // Edit mode: match Home tab calendar width (no extra outer padding)
    if (isEditMode) {
      return '';
    }
    // Live portfolio should be full-bleed on the web.
    if (isLiveMode) {
      return '';
    }
    // Default padding
    return 'px-6';
  };

  const calculateTopPadding = () => {
      // If running on a native platform, add top padding for the header
      if (Capacitor.isNativePlatform()) {
          return 'pt-16';
      }
      if (isLiveMode && isMobile) {
        return '';
      }      
    return 'pt-6';
  }

  const scrollToSection = (sectionKey: string) => {
    const element = document.getElementById(sectionKey);
    if (element) {
      const stickyOffset = isEditMode ? 188 : 160;
      const sectionTop = element.getBoundingClientRect().top + window.scrollY;
      const targetTop = Math.max(0, sectionTop - stickyOffset);

      window.scrollTo({
        top: targetTop,
        behavior: 'smooth',
      });
    }
  };

  const contentAvailability = useMemo(() => ({
    videos: new Set(
      videos
        .filter((video) => video.section_id && video.is_enabled)
        .map((video) => video.section_id as string)
    ),
    releases: new Set(
      musicReleases
        .filter((release) => release.section_id && release.is_enabled)
        .map((release) => release.section_id as string)
    ),
    photos: new Set(
      photos
        .filter((photo) => photo.section_id)
        .map((photo) => photo.section_id as string)
    ),
    events: new Set(
      events
        .filter((event) => event.section_id && event.is_enabled)
        .map((event) => event.section_id as string)
    ),
    featuredCards: new Set(
      featuredCards
        .filter((card) => card.section_id && card.is_enabled)
        .map((card) => card.section_id as string)
    ),
  }), [events, featuredCards, musicReleases, photos, videos]);

  const sectionHasContent = useCallback((sectionKey: string): boolean => {
    const config = sections.section_configs[sectionKey];
    
    switch (sectionKey) {
      case BUILT_IN_SECTION_IDS.videos:
        return contentAvailability.videos.has(sectionKey);
      case BUILT_IN_SECTION_IDS.releases:
        return contentAvailability.releases.has(sectionKey);
      case BUILT_IN_SECTION_IDS.photos:
        return contentAvailability.photos.has(sectionKey);
      case BUILT_IN_SECTION_IDS.events:
        return contentAvailability.events.has(sectionKey);
      case BUILT_IN_SECTION_IDS.featured_cards:
        return contentAvailability.featuredCards.has(sectionKey);
      case BUILT_IN_SECTION_IDS.hero:
      case BUILT_IN_SECTION_IDS.bio:
        return true; // Always show hero and bio sections
      default:
        // For custom sections, check by section type
        if (config?.type) {
          switch (config.type) {
            case 'VideoCarouselSection':
              return contentAvailability.videos.has(sectionKey);
            case 'FeaturedReleaseList':
              return contentAvailability.releases.has(sectionKey);
            case 'PhotoGalleryCarousel':
              return contentAvailability.photos.has(sectionKey);
            case 'NextShowCarousel':
              return contentAvailability.events.has(sectionKey);
            case 'FeaturedPromoCards':
              return contentAvailability.featuredCards.has(sectionKey);
            case 'BookMeSection':
              return true; // BookMe section always has content (the button)
            default:
              return false; // Hide unknown custom sections if empty
          }
        }
        return false; // Hide unknown sections by default
    }
  }, [contentAvailability, sections.section_configs]);

  const renderedSectionKeys = useMemo(
    () =>
      sections.section_order.filter((sectionKey) => {
        if (
          sectionKey === BUILT_IN_SECTION_IDS.hero ||
          sectionKey === BUILT_IN_SECTION_IDS.bio
        ) {
          return false;
        }
        return sections.enabled_sections[sectionKey];
      }),
    [sections.enabled_sections, sections.section_order]
  );

  const renderSection = (
    sectionKey: string,
    sortableProps?: {
      dragHandleProps?: Record<string, any>;
      isDragging?: boolean;
    }
  ) => {
    if (
      sectionKey === BUILT_IN_SECTION_IDS.hero ||
      sectionKey === BUILT_IN_SECTION_IDS.bio
    ) {
      return null;
    }

    if (!sections.enabled_sections[sectionKey]) return null;

    // In live mode, hide empty sections (except BookMe which always has content)
    if (!isEditMode && !sectionHasContent(sectionKey)) return null;

    const config = sections.section_configs[sectionKey];
    const title = getSectionTitle(sectionKey);

    if (!config) {
      return null;
    }

    return (
      <div
        id={sectionKey}
        className={`scroll-mt-48 ${Capacitor.isNativePlatform() ? '': 'mb-2'}`}
      >
        <DynamicSection
          sectionKey={sectionKey}
          config={config}
          title={title}
          isDynamic={isEditMode}
          dragHandleProps={sortableProps?.dragHandleProps}
          isSortable={isEditMode}
          isDragging={sortableProps?.isDragging ?? false}
          isDraggedOver={false}
          isEditMode={isEditMode}
        />
        <SectionSeparator />
      </div>
    );
  };

  if (sectionsLoading) {
    return (
      <div className={cn(
        "min-h-screen pb-8 bg-gradient-to-b from-gray-50 to-white",
        isDesktopLiveCard && "relative overflow-hidden bg-[#d8d2ce] pb-16"
      )}>
        <div className={`w-full ${calculateTopPadding()}`} style={{ maxWidth: getContainerMaxWidth() }}>
          <Card
            className={cn(
              "relative w-full",
              isDesktopLiveCard
                ? "mx-auto min-h-screen max-w-[548px] rounded-[24px] border-0 bg-[#171f33] shadow-[0_28px_90px_-24px_rgba(15,23,42,0.55)]"
                : isLiveMode || isEditMode
                ? "min-h-screen rounded-none border-0 shadow-none"
                : "rounded-2xl shadow-2xl"
            )}
          >
            <div className="p-6 text-center py-16 animate-pulse space-y-4">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto" />
              <div className="h-6 bg-gray-200 rounded w-48 mx-auto" />
              <div className="h-4 bg-gray-200 rounded w-32 mx-auto" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen pb-8 bg-gradient-to-b from-gray-50 to-white",
        isDesktopLiveCard && "relative overflow-hidden bg-[#d8d2ce] pb-16"
      )}
    >
      {isDesktopLiveCard && headerPhoto && (
        <>
          <div
            className="pointer-events-none absolute inset-0 scale-110 bg-center bg-cover opacity-90 blur-[34px]"
            style={{ backgroundImage: `url(${headerPhoto})` }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.42),rgba(216,210,206,0.86)_62%,rgba(216,210,206,0.96)_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[rgba(12,16,28,0.12)]" />
        </>
      )}
      <div
        className={cn(
          "relative z-10 w-full",
          getContainerPadding(),
          calculateTopPadding(),
          isLiveMode && "max-w-none",
          isDesktopLiveCard && "px-6 pt-10"
        )}
        style={{ maxWidth: getContainerMaxWidth() }}
      >
        <Card
          className={cn(
            "relative w-full bg-gradient-transition",
            !isDesktopLiveCard && getCurrentGradient(),
            isDesktopLiveCard
              ? "mx-auto min-h-screen max-w-[548px] rounded-[24px] border-0 bg-[#171f33] shadow-[0_28px_90px_-24px_rgba(15,23,42,0.55)]"
              : isLiveMode || isEditMode
              ? "min-h-screen rounded-none border-x-0 border-t-0 shadow-none"
              : "rounded-2xl shadow-2xl"
          )}
          style={{
            backgroundColor: isDesktopLiveCard ? '#171f33' : themeColors.cardBackground,
            borderColor: isDesktopLiveCard ? 'rgba(255,255,255,0.08)' : themeColors.border,
            color: isDesktopLiveCard ? '#F8FAFC' : themeColors.text
          }}
        >
          {isEditMode && <BackgroundGradientSelector />}
          <div
            className={cn(
              isEditMode
                ? "mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10"
                : "p-6",
              isLiveMode && "mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-10",
              isDesktopLiveCard && "mx-auto max-w-[548px] px-5 py-7"
            )}
          >
            <HeroHeader 
              onSectionClick={scrollToSection} 
              isEditMode={isEditMode}
            />

            {isEditMode ? (
              <EditableSections
                sectionKeys={renderedSectionKeys}
                reorderSections={reorderSections}
                renderSection={renderSection}
              />
            ) : (
              sections.section_order.map((sectionKey) => (
                <React.Fragment key={sectionKey}>
                  {renderSection(sectionKey)}
                </React.Fragment>
              ))
            )}

            {isEditMode && <AddSectionButton />}
            <PageFooter isEditMode={isEditMode} />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PortfolioRenderer;
