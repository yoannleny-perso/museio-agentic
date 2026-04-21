
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBio } from '@/hooks/useBio';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';

interface ShortBioDisplayProps {
  onToggleBio: () => void;
  showFullBio: boolean;
  isEditMode?: boolean;
  isEditingFullBio?: boolean;
  variant?: 'default' | 'hero';
  textColorOverride?: string;
  textShadow?: string;
}

const ShortBioDisplay: React.FC<ShortBioDisplayProps> = ({
  onToggleBio,
  showFullBio,
  isEditMode = true,
  isEditingFullBio = false,
  variant = 'default',
  textColorOverride,
  textShadow,
}) => {
  const { bioShort, bioFull, loading, saveBio } = useBio();
  const { themeColors } = usePortfolioTheme();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState('');
  const isHeroVariant = variant === 'hero';

  React.useEffect(() => {
    setEditValue(bioShort || '');
  }, [bioShort]);

  const handleEditClick = () => {
    if (isEditMode) {
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    const shortValue = editValue.trim();
    await saveBio(shortValue, bioFull || '');
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(bioShort || '');
    setIsEditing(false);
  };

  // Check if there's meaningful additional content in bioFull
  const hasAdditionalContent = bioFull && bioFull.trim() !== '' && bioFull.trim() !== bioShort?.trim();

  if (loading) {
    return (
      <div className={`text-center space-y-2 mb-0 ${isHeroVariant ? 'px-0' : 'px-2'}`}>
        <div 
          className="h-4 rounded animate-pulse mx-auto"
          style={{ 
            backgroundColor: `${themeColors.textSecondary}20`,
            width: '80%'
          }}
        />
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className={`text-center mb-0 ${isHeroVariant ? 'px-0' : 'px-2'}`}>
        <div className="space-y-3">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-2 resize-none text-center"
            style={{
              color: themeColors.text,
              backgroundColor: themeColors.inputBackground,
              borderColor: themeColors.inputBorder,
              boxShadow: `0 0 0 2px ${themeColors.primary}20`,
              textAlign: 'center'
            }}
            placeholder="Enter a short bio or tagline"
            rows={2}
            maxLength={150}
          />
          <div className="text-xs text-center mt-1">
            <span 
              style={{ 
                color: editValue.length >= 130 
                  ? editValue.length >= 150 
                    ? '#ef4444' 
                    : '#f59e0b'
                  : themeColors.textSecondary 
              }}
            >
              {editValue.length}/150 characters
            </span>
          </div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={handleSave}
              className="px-4 py-1 text-xs rounded hover:opacity-90 transition-opacity"
              style={{
                backgroundColor: themeColors.primary,
                color: '#FFFFFF'
              }}
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-1 text-xs rounded transition-colors"
              style={{
                backgroundColor: `${themeColors.textSecondary}20`,
                color: themeColors.text
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${themeColors.textSecondary}30`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = `${themeColors.textSecondary}20`;
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!bioShort) {
    return (
      <div className="text-center mb-0 px-2">
        {isEditMode && (
          <div className="flex flex-col items-center gap-2">
            <Button
              onClick={handleEditClick}
              variant="outline"
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed transition-colors"
              style={{
                borderColor: themeColors.border,
                color: themeColors.textSecondary,
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = themeColors.primary;
                e.currentTarget.style.backgroundColor = `${themeColors.primary}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = themeColors.border;
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Plus className="h-4 w-4" style={{ color: themeColors.textSecondary }} />
              Add Short Bio
            </Button>
            {!isHeroVariant && (
              <Button
                onClick={onToggleBio}
                variant="outline"
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed transition-colors"
                style={{
                  borderColor: themeColors.border,
                  color: themeColors.textSecondary,
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = themeColors.primary;
                  e.currentTarget.style.backgroundColor = `${themeColors.primary}10`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = themeColors.border;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Plus className="h-4 w-4" style={{ color: themeColors.textSecondary }} />
                Add Full Bio
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`text-center mb-0 ${isHeroVariant ? 'px-0' : 'px-2'}`}>
      <p 
        className={`leading-snug transition-colors rounded whitespace-pre-line text-center ${isEditMode ? 'cursor-pointer' : ''} ${
          isHeroVariant ? 'px-3 py-1 text-xl md:text-2xl' : 'p-2 text-sm'
        }`}
        style={{ color: textColorOverride ?? themeColors.textSecondary, textShadow }}
        onClick={handleEditClick}
        onMouseEnter={isEditMode ? (e) => {
          e.currentTarget.style.color = textColorOverride ?? themeColors.text;
          e.currentTarget.style.backgroundColor = `${themeColors.textSecondary}10`;
        } : undefined}
        onMouseLeave={isEditMode ? (e) => {
          e.currentTarget.style.color = textColorOverride ?? themeColors.textSecondary;
          e.currentTarget.style.backgroundColor = 'transparent';
        } : undefined}
      >
        {bioShort}
      </p>
    </div>
  );
};

export default ShortBioDisplay;
