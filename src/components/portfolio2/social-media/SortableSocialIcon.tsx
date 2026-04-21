import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SocialMediaLink } from '@/hooks/useSocialMediaLinks';
import EnhancedSocialMediaIcon from './EnhancedSocialMediaIcon';

interface SortableSocialIconProps {
  link: SocialMediaLink;
  onEdit: (platform: string, currentUrl: string) => void;
  isEditMode: boolean;
  isPlaceholder: boolean;
}

const SortableSocialIcon: React.FC<SortableSocialIconProps> = ({
  link,
  onEdit,
  isEditMode,
  isPlaceholder
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: link.platform,
    disabled: !isEditMode
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(isEditMode ? listeners : {})}
      className={`${isDragging ? 'z-50' : ''} ${isEditMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <EnhancedSocialMediaIcon
        link={link}
        onEdit={onEdit}
        isEditMode={isEditMode}
        isPlaceholder={isPlaceholder}
      />
    </div>
  );
};

export default SortableSocialIcon;