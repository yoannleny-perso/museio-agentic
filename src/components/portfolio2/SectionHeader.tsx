
import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, Move } from 'lucide-react';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';
import EditableSectionTitle from './EditableSectionTitle';
import DeleteSectionDialog from './DeleteSectionDialog';

interface SectionHeaderProps {
  sectionKey: string;
  title: string;
  onTitleSave: (newTitle: string) => Promise<boolean>;
  onDelete: () => void;
  onAddContent?: () => void;
  isBuiltIn?: boolean;
  className?: string;
  hideAddButton?: boolean;
  isEditMode?: boolean;
  dragHandleProps?: Record<string, any>;
  isSortable?: boolean;
  isDragging?: boolean;
  isDraggedOver?: boolean;
  // Reorder mode props for PhotoGallery and MusicSection
  showReorderToggle?: boolean;
  isReorderMode?: boolean;
  onReorderModeChange?: (enabled: boolean) => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  sectionKey,
  title,
  onTitleSave,
  onDelete,
  onAddContent,
  isBuiltIn = false,
  className = "mb-4",
  hideAddButton = false,
  isEditMode = true,
  dragHandleProps,
  isSortable = false,
  isDragging = false,
  isDraggedOver = false,
  showReorderToggle = false,
  isReorderMode = false,
  onReorderModeChange
}) => {
  const { themeColors } = usePortfolioTheme();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    onDelete();
    setShowDeleteDialog(false);
  };

  const handleReorderToggle = () => {
    if (onReorderModeChange) {
      onReorderModeChange(!isReorderMode);
    }
  };

  const handleAddContentClick = () => {
    if (onAddContent) {
      onAddContent();
    }
  };

  return (
    <>
      <div 
        className={`flex items-center justify-between ${className} transition-opacity ${isDragging ? 'opacity-50' : ''} ${isDraggedOver ? 'bg-primary/10 border-primary/20 border-2 rounded-lg' : ''}`}
      >
        {/* Left side: Drag Handle, Title and Action Buttons */}
        <div className="flex items-center gap-3 flex-1">
          {/* Drag Handle - Only in edit mode */}
          {isEditMode && isSortable && (
            <button
              type="button"
              {...dragHandleProps}
              className="p-1.5 rounded-lg transition-colors flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-primary/10"
              style={{
                color: themeColors.textSecondary,
                backgroundColor: 'transparent',
                touchAction: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = themeColors.primary;
                e.currentTarget.style.backgroundColor = `${themeColors.primary}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = themeColors.textSecondary;
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label="Reorder section"
              title="Drag to reorder section"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}

          <EditableSectionTitle
            title={title}
            onSave={onTitleSave}
            isEditMode={isEditMode}
          />
          
          {/* Action buttons - Only in edit mode */}
          {isEditMode && (
            <div className="flex items-center gap-1">
              {!hideAddButton && (
                <button
                  type="button"
                  onClick={handleAddContentClick}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{
                    color: themeColors.primary,
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${themeColors.primary}10`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  title="Add content"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
              
              {/* Reorder toggle - Only for sections that support it */}
              {showReorderToggle && (
                <button
                  type="button"
                  onClick={handleReorderToggle}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{
                    color: isReorderMode ? themeColors.primary : themeColors.textSecondary,
                    backgroundColor: isReorderMode ? `${themeColors.primary}20` : 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isReorderMode 
                      ? `${themeColors.primary}30` 
                      : `${themeColors.primary}10`;
                    e.currentTarget.style.color = themeColors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = isReorderMode ? themeColors.primary : themeColors.textSecondary;
                    e.currentTarget.style.backgroundColor = isReorderMode ? `${themeColors.primary}20` : 'transparent';
                  }}
                  title={isReorderMode ? 'Disable reorder mode' : 'Enable reorder mode'}
                >
                  <Move className="h-4 w-4" />
                </button>
              )}
              
              <button
                type="button"
                onClick={handleDeleteClick}
                className="p-1.5 rounded-lg transition-colors"
                style={{
                  color: themeColors.textSecondary
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = themeColors.dangerColor;
                  e.currentTarget.style.backgroundColor = `${themeColors.dangerColor}10`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = themeColors.textSecondary;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title={isBuiltIn ? 'Disable section' : 'Delete section'}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <DeleteSectionDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        sectionTitle={title}
        isBuiltIn={isBuiltIn}
      />
    </>
  );
};

export default SectionHeader;
