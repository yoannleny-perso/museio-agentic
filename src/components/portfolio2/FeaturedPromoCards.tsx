import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';
import { useModedPortfolioData } from '@/context/PortfolioDataContextModed';
import { usePortfolioMode } from '@/context/PortfolioModeContext';
import { Edit, Trash2, Star, Plus } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import FeaturedCardPhotoUploader from './FeaturedCardPhotoUploader';
import DeleteCardDialog from './DeleteCardDialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from '@/components/ui/carousel';

interface FeaturedPromoCardsProps {
  onNavigationReady?: (navigation: {
    onNavigatePrev: () => void;
    onNavigateNext: () => void;
    canNavigatePrev: boolean;
    canNavigateNext: boolean;
  }) => void;
  onAddContent?: () => void;
  sectionKey?: string;
  isEditMode?: boolean;
}

export interface FeaturedPromoCardsRef {
  triggerAdd: () => void;
}

const FeaturedPromoCards = forwardRef<FeaturedPromoCardsRef, FeaturedPromoCardsProps>(({
  onNavigationReady,
  sectionKey,
  onAddContent,
  isEditMode = true
}, ref) => {
  const { mode } = usePortfolioMode();
  const { featuredCards: contextCards, featuredCardsLoading, createFeaturedCard, updateFeaturedCard, deleteFeaturedCard } = useModedPortfolioData();
  
  // Filter cards by section key
  const cards = sectionKey 
    ? contextCards?.filter(card => card.section_id === sectionKey) || []
    : contextCards || [];
  const { themeColors } = usePortfolioTheme();
  const [isCreating, setIsCreating] = useState(false);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    button_link: '',
    icon_url: '',
    display_order: 0,
    is_enabled: true
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const enabledCards = cards.filter(card => card.is_enabled);
  const firstCard = enabledCards.length > 0 ? enabledCards[0] : null;

  // Expose triggerAdd method through ref, but only allow if no cards exist and in edit mode
  useImperativeHandle(ref, () => ({
    triggerAdd: () => {
      if (enabledCards.length === 0 && mode === 'edit') {
        setIsCreating(true);
      }
    }
  }), [enabledCards.length, mode]);

  const handleCreateCard = async () => {
    const result = await createFeaturedCard({
      ...formData,
      button_text: 'Learn More', // Keep default for database compatibility
      background_color: '#000000', // Default value, not used for styling (using dynamic theme colors)
      section_id: sectionKey || null
    });
    if (result) {
      setIsCreating(false);
      setFormData({
        title: '',
        subtitle: '',
        button_link: '',
        icon_url: '',
        display_order: 0,
        is_enabled: true
      });
    }
  };

  const handleUpdateCard = async (id: string) => {
    await updateFeaturedCard(id, {
      ...formData,
      button_text: 'Learn More' // Keep default for database compatibility
      // Note: Not updating background_color - using dynamic theme colors for styling
    });
    setEditingCard(null);
  };

  const startEdit = (card: any) => {
    setFormData({
      title: card.title,
      subtitle: card.subtitle || '',
      button_link: card.button_link || '',
      icon_url: card.icon_url || '',
      display_order: card.display_order,
      is_enabled: card.is_enabled
    });
    setEditingCard(card.id);
  };

  const handleCardClick = (card: any, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    if (card.button_link) {
      window.open(card.button_link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleAddCard = () => {
    if (enabledCards.length === 0 && mode === 'edit') {
      setIsCreating(true);
    }
  };

  const handleImageChange = (url: string | null) => {
    setFormData(prev => ({ ...prev, icon_url: url || '' }));
  };

  const handleDeleteCard = (card: any) => {
    setCardToDelete(card);
    setShowDeleteDialog(true);
  };

  const confirmDeleteCard = async () => {
    if (cardToDelete && mode === 'edit') {
      await deleteFeaturedCard(cardToDelete.id);
      setShowDeleteDialog(false);
      setCardToDelete(null);
    }
  };

  const cancelDeleteCard = () => {
    setShowDeleteDialog(false);
    setCardToDelete(null);
  };

  // Get dynamic theme-based background color for cards
  const getCardBackgroundColor = (cardIndex: number) => {
    const variant = cardIndex % 3;
    switch (variant) {
      case 0:
        return themeColors.cardBackgroundPrimary;
      case 1:
        return themeColors.cardBackgroundSecondary;
      default:
        return themeColors.cardBackgroundTertiary;
    }
  };

  if (featuredCardsLoading) {
    return (
      <div className="space-y-3">
        <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      {mode === 'edit' && (isCreating || editingCard) && (
        <div 
          className="border rounded-xl p-4 mb-4 shadow-sm"
          style={{ 
            backgroundColor: themeColors.background,
            borderColor: themeColors.border
          }}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <label className="block text-sm font-medium mb-2" style={{ color: themeColors.text }}>Photo</label>
                <FeaturedCardPhotoUploader
                  currentImage={formData.icon_url}
                  onImageChange={handleImageChange}
                  isUploading={isUploadingImage}
                />
              </div>
              
              <div className="col-span-2 space-y-3">
                <input
                  type="text"
                  placeholder="Card title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                    color: themeColors.text
                  }}
                />
                <input
                  type="text"
                  placeholder="Subtitle (optional)"
                  value={formData.subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                    color: themeColors.text
                  }}
                />
                <input
                  type="url"
                  placeholder="Add url link"
                  value={formData.button_link}
                  onChange={(e) => setFormData(prev => ({ ...prev, button_link: e.target.value }))}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: themeColors.background,
                    borderColor: themeColors.border,
                    color: themeColors.text
                  }}
                />
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <button
                onClick={isCreating ? handleCreateCard : () => handleUpdateCard(editingCard!)}
                disabled={!formData.title || isUploadingImage}
                className="px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ 
                  backgroundColor: themeColors.primary
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = themeColors.buttonHover}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = themeColors.primary}
              >
                {isCreating ? 'Create' : 'Update'}
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingCard(null);
                }}
                className="px-4 py-2 rounded-lg transition-colors"
                style={{ 
                  backgroundColor: themeColors.background,
                  color: themeColors.textSecondary,
                  border: `1px solid ${themeColors.border}`
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {enabledCards.length === 0 && !isCreating && !editingCard ? (
        <div className="text-center py-12">
          <div 
            className="rounded-lg p-8 max-w-md mx-auto border-2 border-dashed"
            style={{ 
              backgroundColor: themeColors.cardBackground, 
              borderColor: themeColors.border, 
              color: themeColors.text 
            }}
          >
            <Star 
              className="w-12 h-12 mx-auto mb-4" 
              style={{ color: themeColors.textSecondary }}
            />
            
            {mode === 'edit' && (
              <Button 
                onClick={handleAddCard}
                className="font-medium transition-all hover:scale-105"
                style={{
                  backgroundColor: themeColors.primary,
                  color: '#FFFFFF',
                  borderColor: themeColors.primary
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = themeColors.buttonHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = themeColors.primary;
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Featured Card
              </Button>
            )}
          </div>
        </div>
      ) : firstCard ? (
        <div
          onClick={(e) => handleCardClick(firstCard, e)}
          className={`relative rounded-xl p-3 overflow-hidden group h-32 flex items-stretch transition-transform duration-200 ${
            firstCard.button_link ? 'cursor-pointer hover:scale-[1.02]' : ''
          }`}
          style={{ 
            backgroundColor: getCardBackgroundColor(0),
            color: themeColors.text
          }}
        >
          <div className="relative z-10 flex items-stretch w-full gap-3">
            <div className="flex-shrink-0" style={{ width: '80px' }}>
              <AspectRatio ratio={4/5} className="h-full">
                {firstCard.icon_url ? (
                  <img
                    src={firstCard.icon_url}
                    alt={firstCard.title}
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-full h-full bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center ${firstCard.icon_url ? 'hidden' : ''}`}>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center mx-auto mb-1">
                      <span className="text-xs">📷</span>
                    </div>
                    <span className="text-xs opacity-80">Photo</span>
                  </div>
                </div>
              </AspectRatio>
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h4 className="font-semibold text-sm mb-1 leading-tight line-clamp-2" style={{ color: themeColors.text }}>{firstCard.title}</h4>
              {firstCard.subtitle && (
                <p className="text-xs leading-tight line-clamp-2" style={{ color: themeColors.textSecondary }}>{firstCard.subtitle}</p>
              )}
            </div>

            {mode === 'edit' && (
              <div className="flex flex-col gap-1 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEdit(firstCard);
                  }}
                  className="p-1 rounded hover:opacity-80 transition-colors"
                  style={{ 
                    backgroundColor: `${themeColors.background}80`,
                    color: themeColors.text
                  }}
                >
                  <Edit className="h-2.5 w-2.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCard(firstCard);
                  }}
                  className="p-1 rounded hover:opacity-80 transition-colors"
                  style={{ 
                    backgroundColor: `${themeColors.background}80`,
                    color: themeColors.dangerColor
                  }}
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <DeleteCardDialog
        isOpen={showDeleteDialog}
        onClose={cancelDeleteCard}
        onConfirm={confirmDeleteCard}
        cardTitle={cardToDelete?.title || ''}
      />
    </div>
  );
});

FeaturedPromoCards.displayName = 'FeaturedPromoCards';

export default FeaturedPromoCards;
