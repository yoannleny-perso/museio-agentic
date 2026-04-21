
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { SocialMediaLink } from '@/hooks/useSocialMediaLinks';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableSocialIcon from './social-media/SortableSocialIcon';
import EnhancedAddPlatformMenu from './social-media/EnhancedAddPlatformMenu';
import SocialMediaModal from './social-media/SocialMediaModal';
import EmptyStateIcons from './social-media/EmptyStateIcons';

interface SocialMediaIconsProps {
  socialLinks: SocialMediaLink[];
  loading?: boolean;
  onUpdateLink?: (platform: string, updates: Partial<SocialMediaLink>) => void;
  onSaveLinks?: (links: SocialMediaLink[]) => Promise<void>;
  onReorderLinks?: (oldIndex: number, newIndex: number) => Promise<void>;
  isEditMode?: boolean;
  compactEmptyState?: boolean;
}

const SocialMediaIcons: React.FC<SocialMediaIconsProps> = ({ 
  socialLinks, 
  loading = false, 
  onUpdateLink, 
  onSaveLinks,
  onReorderLinks,
  isEditMode = false,
  compactEmptyState = false,
}) => {
  const { themeColors } = usePortfolioTheme();
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Set up drag sensors with distance threshold to prevent accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    platform: string;
    currentUrl: string;
    isNewPlatform: boolean;
  }>({
    isOpen: false,
    platform: '',
    currentUrl: '',
    isNewPlatform: false
  });

  const availablePlatforms = [
    'instagram', 'tiktok', 'youtube', 'facebook', 'soundcloud', 'spotify', 
    'twitter', 'bandcamp', 'email', 'apple-music', 'linkedin', 'discord', 
    'twitch', 'patreon', 'mixcloud', 'beatport'
  ];

  // Simplified visibility logic: only show platforms that are enabled AND have URLs
  const visibleLinks = socialLinks.filter(link => 
    link.enabled && link.url && link.url.trim()
  );

  // Sort links by order for consistent display
  const sortedVisibleLinks = [...visibleLinks].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  const displayedLinks = sortedVisibleLinks;

  const handleEditClick = (platform: string, currentUrl: string) => {
    setModalState({
      isOpen: true,
      platform,
      currentUrl,
      isNewPlatform: !currentUrl
    });
  };

  const handleAddPlatform = (platform: string) => {
    setModalState({
      isOpen: true,
      platform,
      currentUrl: '',
      isNewPlatform: true
    });
    setShowAddMenu(false);
  };

  const handleSaveModal = async (url: string) => {
    if (!onUpdateLink) return;
    
    const { platform } = modalState;
    
    // Handle email platform with mailto: prefix
    const processedUrl = platform === 'email' && url && !url.startsWith('mailto:') 
      ? `mailto:${url}` 
      : url;
    
    onUpdateLink(platform, { 
      url: processedUrl.trim(), 
      enabled: true 
    });
  };

  const handleDeleteModal = async () => {
    if (!onUpdateLink) return;
    
    const { platform } = modalState;
    
    // When deleting, disable the platform completely
    onUpdateLink(platform, { 
      url: '', 
      enabled: false
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      platform: '',
      currentUrl: '',
      isNewPlatform: false
    });
  };

  const closeAddMenu = () => {
    setShowAddMenu(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!active || !over || !onReorderLinks) return;
    
    if (active.id !== over.id) {
      const oldIndex = displayedLinks.findIndex(link => link.platform === active.id);
      const newIndex = displayedLinks.findIndex(link => link.platform === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderLinks(oldIndex, newIndex);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3].map((i) => (
          <div 
            key={i} 
            className="w-8 h-8 rounded animate-pulse" 
            style={{ backgroundColor: `${themeColors.textSecondary}20` }}
          />
        ))}
      </div>
    );
  }

  // Show empty state if no links are configured
  if (displayedLinks.length === 0 && !isEditMode) {
    return ;
  }

  const renderIcons = () => (
    <div className="flex items-center justify-center gap-4 flex-wrap">
      {displayedLinks.map((link) => (
        <SortableSocialIcon
          key={link.platform}
          link={link}
          onEdit={handleEditClick}
          isEditMode={isEditMode}
          isPlaceholder={false} // No more placeholders since we only show configured links
        />
      ))}
      
      {/* Add more platforms button */}
      {isEditMode && (
          <>
                {compactEmptyState ? (
                  <button
                    type="button"
                    onClick={() => setShowAddMenu(true)}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed transition-colors"
                    style={{
                      borderColor: themeColors.border,
                      color: themeColors.socialIconColor,
                      backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = themeColors.primary;
                      e.currentTarget.style.color = themeColors.socialIconHover;
                      e.currentTarget.style.backgroundColor = `${themeColors.primary}10`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = themeColors.border;
                      e.currentTarget.style.color = themeColors.socialIconColor;
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    aria-label="Add social media"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                ) : (
                  <EmptyStateIcons
                    onShowAddMenu={() => setShowAddMenu(true)}
                  />
                )}
            
            <EnhancedAddPlatformMenu
              open={showAddMenu}
              availablePlatforms={availablePlatforms.filter(platform => {
                const existingLink = socialLinks.find(link => link.platform === platform);
                // Show platforms that don't exist, are disabled, or are enabled but have no URL
                return !existingLink || !existingLink.enabled || !existingLink.url || !existingLink.url.trim();
              })}
              onAddPlatform={handleAddPlatform}
              onClose={closeAddMenu}
            />
          </>
        )}
    </div>
  );

  return (
    <>
      {isEditMode ? (
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={displayedLinks.map(link => link.platform)} 
            strategy={horizontalListSortingStrategy}
          >
            {renderIcons()}
          </SortableContext>
        </DndContext>
      ) : (
        renderIcons()
      )}

      {/* Modal for editing/adding platforms */}
      <SocialMediaModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        platform={modalState.platform}
        currentUrl={modalState.currentUrl}
        onSave={handleSaveModal}
        onDelete={handleDeleteModal}
        isNewPlatform={modalState.isNewPlatform}
      />
    </>
  );
};

export default SocialMediaIcons;
