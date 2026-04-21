import React from 'react';
import ImageEditor from './ImageEditor';
import PortfolioDialog from './PortfolioDialog';
import { Button } from '@/components/ui/button';

interface ImageEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File | null;
  aspectRatio?: number;
  onSave: (editedFile: File) => void;
  title?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  secondaryActionDisabled?: boolean;
}

const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  open,
  onOpenChange,
  imageFile,
  aspectRatio = 4/5,
  onSave,
  title = "Edit Image",
  secondaryActionLabel,
  onSecondaryAction,
  secondaryActionDisabled = false,
}) => {
  const handleSave = (editedFile: File) => {
    onSave(editedFile);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!imageFile) return null;

  return (
    <PortfolioDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      className="max-w-md w-full"
    >
      {secondaryActionLabel && onSecondaryAction ? (
        <div className="mb-3 flex justify-start">
          <Button
            type="button"
            variant="outline"
            onClick={onSecondaryAction}
            disabled={secondaryActionDisabled}
            className="text-black"
          >
            {secondaryActionLabel}
          </Button>
        </div>
      ) : null}
      <ImageEditor
        imageFile={imageFile}
        aspectRatio={aspectRatio}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </PortfolioDialog>
  );
};

export default ImageEditorModal;
