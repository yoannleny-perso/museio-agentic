
import React, { useState, useRef, useEffect } from 'react';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';

interface EditableSectionTitleProps {
  title: string;
  onSave: (newTitle: string) => Promise<boolean>;
  className?: string;
  isEditMode?: boolean;
}

const EditableSectionTitle: React.FC<EditableSectionTitleProps> = ({
  title,
  onSave,
  className = "text-lg font-semibold",
  isEditMode = true
}) => {
  const { themeColors } = usePortfolioTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(title);
  }, [title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (isEditMode) {
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (editValue.trim() !== title && editValue.trim() !== '') {
      setIsSaving(true);
      const success = await onSave(editValue.trim());
      setIsSaving(false);
      if (success) {
        setIsEditing(false);
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`${className} px-2 py-1 rounded border focus:outline-none focus:ring-2 bg-transparent`}
        style={{
          color: themeColors.sectionTitleColor,
          backgroundColor: themeColors.inputBackground,
          borderColor: themeColors.inputBorder,
          boxShadow: `0 0 0 2px ${themeColors.primary}20`
        }}
        disabled={isSaving}
      />
    );
  }

  return (
    <h3 
      className={`${className} px-2 py-1 rounded transition-colors ${isEditMode ? 'cursor-pointer' : ''}`}
      style={{
        color: themeColors.sectionTitleColor,
        minHeight: '2rem'
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
      {title}
    </h3>
  );
};

export default EditableSectionTitle;
