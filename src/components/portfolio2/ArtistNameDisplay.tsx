
import React, { useState, useRef, useEffect } from 'react';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';

interface ArtistNameDisplayProps {
  artistName: string;
  loading: boolean;
  onSave: (name: string) => Promise<void>;
  isEditMode?: boolean;
  variant?: 'default' | 'hero';
  textColorOverride?: string;
  textShadow?: string;
}

const ArtistNameDisplay: React.FC<ArtistNameDisplayProps> = ({
  artistName,
  loading,
  onSave,
  isEditMode = true,
  variant = 'default',
  textColorOverride,
  textShadow,
}) => {
  const { themeColors } = usePortfolioTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(artistName);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isHeroVariant = variant === 'hero';

  useEffect(() => {
    setEditValue(artistName);
  }, [artistName]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!loading && isEditMode) {
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (editValue.trim() !== artistName) {
      setIsSaving(true);
      await onSave(editValue.trim());
      setIsSaving(false);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(artistName);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (loading) {
  return (
    <div className="text-center mb-0">
      <div 
        className={`rounded-lg animate-pulse mx-auto ${isHeroVariant ? 'h-12 max-w-64' : 'h-8 max-w-48'}`}
        style={{ backgroundColor: `${themeColors.textSecondary}20` }}
      />
    </div>
  );
  }

  if (isEditing) {
    return (
      <div className="text-center mb-2">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={`font-bold tracking-tight px-3 py-2 rounded-md border focus-visible:outline-none focus-visible:ring-2 text-center max-w-full ${
            isHeroVariant ? 'text-4xl md:text-5xl' : 'text-2xl'
          }`}
        style={{
          color: textColorOverride ?? themeColors.sectionTitleColor,
          backgroundColor: themeColors.inputBackground,
          borderColor: themeColors.inputBorder,
          boxShadow: `0 0 0 2px ${themeColors.primary}20`,
          textShadow,
        }}
          placeholder="Enter artist name"
          disabled={isSaving}
        />
      </div>
    );
  }

  return (
    <div className="text-center mb-0">
      <h1 
        className={`font-bold tracking-tight rounded transition-colors ${isEditMode ? 'cursor-pointer' : ''} ${
          isHeroVariant ? 'px-3 py-2 text-[3rem] leading-none md:text-[4rem]' : 'px-2 py-1 text-2xl'
        }`}
        style={{
          color: textColorOverride ?? themeColors.sectionTitleColor,
          minHeight: isHeroVariant ? '3rem' : '2rem'
        }}
        onClick={handleClick}
        onMouseEnter={isEditMode ? (e) => {
          e.currentTarget.style.color = themeColors.primary;
          e.currentTarget.style.backgroundColor = `${themeColors.primary}10`;
        } : undefined}
        onMouseLeave={isEditMode ? (e) => {
          e.currentTarget.style.color = themeColors.sectionTitleColor;
          e.currentTarget.style.backgroundColor = 'transparent';
        } : undefined}
      >
        {artistName || (
          <span 
            style={{ 
              color: textColorOverride ?? `${themeColors.textSecondary}80`,
              fontStyle: 'italic'
            }}
          >
            {isEditMode ? 'Click to add artist name' : 'Artist Name'}
          </span>
        )}
      </h1>
    </div>
  );
};

export default ArtistNameDisplay;
