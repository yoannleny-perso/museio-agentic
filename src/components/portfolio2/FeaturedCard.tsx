
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';
import { Edit, Trash2 } from 'lucide-react';

interface FeaturedCardProps {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  linkUrl?: string;
  onEdit: () => void;
  onDelete: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary';
}

const FeaturedCard: React.FC<FeaturedCardProps> = ({
  id,
  title,
  description,
  imageUrl,
  linkUrl,
  onEdit,
  onDelete,
  variant = 'primary'
}) => {
  const { themeColors } = usePortfolioTheme();
  const [isHovered, setIsHovered] = useState(false);

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return themeColors.cardBackgroundPrimary;
      case 'secondary':
        return themeColors.cardBackgroundSecondary;
      case 'tertiary':
        return themeColors.cardBackgroundTertiary;
      default:
        return themeColors.cardBackgroundPrimary;
    }
  };

  const cardContent = (
    <Card 
      className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:shadow-lg cursor-pointer"
      style={{
        backgroundColor: getBackgroundColor(),
        borderColor: themeColors.border,
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Action buttons - only visible on hover */}
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit();
          }}
          className="p-1.5 rounded-full transition-colors"
          style={{
            backgroundColor: themeColors.background,
            color: themeColors.textSecondary
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = themeColors.primary;
            e.currentTarget.style.backgroundColor = `${themeColors.primary}10`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = themeColors.textSecondary;
            e.currentTarget.style.backgroundColor = themeColors.background;
          }}
        >
          <Edit className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 rounded-full transition-colors"
          style={{
            backgroundColor: themeColors.background,
            color: themeColors.textSecondary
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = themeColors.dangerColor;
            e.currentTarget.style.backgroundColor = `${themeColors.dangerColor}10`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = themeColors.textSecondary;
            e.currentTarget.style.backgroundColor = themeColors.background;
          }}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {/* Card content */}
      <div className="p-4">
        {imageUrl && (
          <div className="mb-3 rounded-lg overflow-hidden">
            <img 
              src={imageUrl} 
              alt={title} 
              className="w-full h-32 object-cover"
            />
          </div>
        )}
        
        <h4 
          className="font-semibold text-sm mb-2 line-clamp-2"
          style={{ color: themeColors.text }}
        >
          {title}
        </h4>
        
        {description && (
          <p 
            className="text-xs leading-relaxed line-clamp-3"
            style={{ color: themeColors.textSecondary }}
          >
            {description}
          </p>
        )}
      </div>
    </Card>
  );

  if (linkUrl) {
    return (
      <a 
        href={linkUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block"
      >
        {cardContent}
      </a>
    );
  }

  return cardContent;
};

export default FeaturedCard;
