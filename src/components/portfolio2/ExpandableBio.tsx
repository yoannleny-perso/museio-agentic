
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBio } from '@/hooks/useBio';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';

interface ExpandableBioProps {
  isEditMode?: boolean;
  onEditingChange?: (isEditing: boolean) => void;
  onCloseBio?: () => void;
}

const ExpandableBio: React.FC<ExpandableBioProps> = ({ isEditMode = false, onEditingChange, onCloseBio }) => {
  const { bioShort, bioFull, loading, saving, saveBio } = useBio();
  const { themeColors } = usePortfolioTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editFull, setEditFull] = useState('');

  const displayBio = bioFull;
  const hasAdditionalContent = bioFull && bioFull.trim() !== '';

  React.useEffect(() => {
    setEditFull(bioFull || '');
    // If there's no full bio content, start in editing mode only when in edit mode
    if (!hasAdditionalContent && isEditMode) {
      setIsEditing(true);
      onEditingChange?.(true);
    }
  }, [bioFull, hasAdditionalContent, isEditMode, onEditingChange]);

  const handleEditClick = () => {
    if (isEditMode) {
      setIsEditing(true);
      onEditingChange?.(true);
    }
  };

  const handleSave = async () => {
    // Preserve existing bioShort when saving only bioFull
    await saveBio(bioShort || '', editFull.trim());
    setIsEditing(false);
    onEditingChange?.(false);
  };

  const handleCancel = () => {
    setEditFull(bioFull || '');
    setIsEditing(false);
    onEditingChange?.(false);
    
    // If we're canceling a new bio creation (no existing content), close the full bio section
    if (!hasAdditionalContent) {
      onCloseBio?.();
    }
  };

  if (loading) {
    return (
      <div className="text-center space-y-2">
        <div 
          className="h-4 rounded animate-pulse"
          style={{ backgroundColor: `${themeColors.textSecondary}20` }}
        />
        <div 
          className="h-4 rounded animate-pulse w-3/4 mx-auto"
          style={{ backgroundColor: `${themeColors.textSecondary}20` }}
        />
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="space-y-4" style={{ backgroundColor: 'transparent' }}>
        <div>
          <label 
            className="block text-sm font-medium mb-2"
            style={{ color: themeColors.text }}
          >
            Full Bio
          </label>
          <textarea
            value={editFull}
            onChange={(e) => setEditFull(e.target.value)}
            className="w-full p-2 rounded-lg focus:outline-none focus:ring-2 resize-none"
            style={{
              color: themeColors.text,
              backgroundColor: themeColors.inputBackground,
              borderColor: themeColors.inputBorder,
              border: `1px solid ${themeColors.inputBorder}`,
              boxShadow: `0 0 0 2px ${themeColors.primary}20`
            }}
            rows={4}
            placeholder="Tell your story in detail..."
            disabled={saving}
            maxLength={600}
          />
          <div className="text-xs text-center mt-1">
            <span 
              style={{ 
                color: editFull.length >= 520 
                  ? editFull.length >= 580 
                    ? '#ef4444' 
                    : '#f59e0b'
                  : themeColors.textSecondary 
              }}
            >
              {editFull.length}/600 characters
            </span>
          </div>
        </div>
        <div className="flex gap-2 justify-center">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 text-sm rounded-lg transition-colors disabled:opacity-50"
            style={{
              backgroundColor: themeColors.primary,
              color: '#FFFFFF'
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.backgroundColor = themeColors.buttonHover;
              }
            }}
            onMouseLeave={(e) => {
              if (!saving) {
                e.currentTarget.style.backgroundColor = themeColors.primary;
              }
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="px-6 py-2 text-sm rounded-lg transition-colors disabled:opacity-50"
            style={{
              backgroundColor: `${themeColors.textSecondary}20`,
              color: themeColors.text
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.backgroundColor = `${themeColors.textSecondary}30`;
              }
            }}
            onMouseLeave={(e) => {
              if (!saving) {
                e.currentTarget.style.backgroundColor = `${themeColors.textSecondary}20`;
              }
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (!displayBio) {
    // Don't show placeholder in live mode
    if (!isEditMode) {
      return null;
    }
    
    return (
      <div className="flex justify-center">
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
          Add Full Bio
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4" style={{ backgroundColor: 'transparent' }}>
      <div 
        className={`text-justify leading-loose whitespace-pre-line text-sm p-4 rounded ${
          isEditMode ? 'cursor-pointer transition-colors' : ''
        }`}
        style={{ color: themeColors.text }}
        onClick={isEditMode ? handleEditClick : undefined}
        onMouseEnter={isEditMode ? (e) => {
          e.currentTarget.style.backgroundColor = `${themeColors.textSecondary}10`;
        } : undefined}
        onMouseLeave={isEditMode ? (e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        } : undefined}
      >
        {displayBio}
      </div>
    </div>
  );
};

export default ExpandableBio;
