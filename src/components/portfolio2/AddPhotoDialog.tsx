import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, ImageIcon, Edit } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import ImageEditorModal from './ImageEditorModal';
import PortfolioDialog from './PortfolioDialog';

interface AddPhotoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPhotosAdded: () => void;
  onUpload: (files: File[], sectionId?: string) => Promise<void>;
  uploading: boolean;
  sectionId?: string;
}

const AddPhotoDialog: React.FC<AddPhotoDialogProps> = ({
  open,
  onOpenChange,
  onPhotosAdded,
  onUpload,
  uploading,
  sectionId
}) => {
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [editingFileIndex, setEditingFileIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    
    // Filter for images and check file size
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        return false;
      }
      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: `${file.name} is ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum allowed is 10MB.`,
          variant: 'destructive'
        });
        return false;
      }
      return true;
    });

    setSelectedFiles(validFiles);

    // Create previews
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => {
      // Clean up old previews
      prev.forEach(url => URL.revokeObjectURL(url));
      return newPreviews;
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      // Clean up the removed preview
      URL.revokeObjectURL(prev[index]);
      return newPreviews;
    });
  };

  const editFile = (index: number) => {
    setEditingFileIndex(index);
    setShowImageEditor(true);
  };

  const handleImageEditorSave = (editedFile: File) => {
    if (editingFileIndex !== null) {
      // Update the file and preview
      setSelectedFiles(prev => {
        const newFiles = [...prev];
        newFiles[editingFileIndex] = editedFile;
        return newFiles;
      });

      setPreviews(prev => {
        const newPreviews = [...prev];
        // Clean up old preview
        URL.revokeObjectURL(newPreviews[editingFileIndex]);
        // Create new preview
        newPreviews[editingFileIndex] = URL.createObjectURL(editedFile);
        return newPreviews;
      });
    }
    setShowImageEditor(false);
    setEditingFileIndex(null);
  };

  const handleImageEditorCancel = () => {
    setShowImageEditor(false);
    setEditingFileIndex(null);
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) return;

    try {
      await onUpload(selectedFiles, sectionId);
      onPhotosAdded();
      handleClose();
    } catch (error) {
      // Error handled by the hook
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFiles([]);
      setPreviews(prev => {
        prev.forEach(url => URL.revokeObjectURL(url));
        return [];
      });
      onOpenChange(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    
    // Filter for images and check file size
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        return false;
      }
      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: `${file.name} is ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum allowed is 10MB.`,
          variant: 'destructive'
        });
        return false;
      }
      return true;
    });
    
    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => {
        prev.forEach(url => URL.revokeObjectURL(url));
        return newPreviews;
      });
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <PortfolioDialog
      open={open}
      onOpenChange={handleClose}
      title="Add Photos"
      className="max-w-lg w-full"
    >

        <div 
          className="space-y-4"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {/* File Drop Zone - only show when no files selected */}
          {selectedFiles.length === 0 && (
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={handleUploadClick}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium mb-1 text-foreground">
                Drop photos here or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, WebP up to 10MB each
              </p>
            </div>
          )}

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Selected Photos ({selectedFiles.length})
              </Label>
              <div 
                className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto cursor-pointer"
                onClick={handleUploadClick}
              >
                  {previews.map((preview, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded hover:opacity-80 transition-opacity"
                      />
                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            editFile(index);
                          }}
                          className="p-1 bg-black bg-opacity-70 text-white rounded-full hover:bg-opacity-90 transition-colors"
                          disabled={uploading}
                          title="Edit image"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                          }}
                          className="p-1 bg-black bg-opacity-70 text-white rounded-full hover:bg-opacity-90 transition-colors"
                          disabled={uploading}
                          title="Remove image"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={uploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={uploading || selectedFiles.length === 0}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {uploading ? (
                <>
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Upload {selectedFiles.length} Photo{selectedFiles.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Image Editor Modal */}
        <ImageEditorModal
          open={showImageEditor}
          onOpenChange={setShowImageEditor}
          imageFile={editingFileIndex !== null ? selectedFiles[editingFileIndex] : null}
          aspectRatio={1} // Square by default for gallery photos
          onSave={handleImageEditorSave}
          title="Edit Photo"
        />
    </PortfolioDialog>
  );
};

export default AddPhotoDialog;
