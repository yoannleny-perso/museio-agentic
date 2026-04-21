
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, Camera, Image as ImageIcon, Edit } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';
import ImageEditorModal from './ImageEditorModal';

interface FeaturedCardPhotoUploaderProps {
  currentImage?: string;
  onImageChange: (url: string | null) => void;
  isUploading?: boolean;
  className?: string;
}

const FeaturedCardPhotoUploader: React.FC<FeaturedCardPhotoUploaderProps> = ({
  currentImage,
  onImageChange,
  isUploading = false,
  className
}) => {
  const { user } = useAuth();
  const { themeColors } = usePortfolioTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(currentImage || '');
  const [isDragOver, setIsDragOver] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      console.error('File size must be less than 5MB');
      return;
    }

    // Open image editor instead of direct upload
    setSelectedFile(file);
    setShowImageEditor(true);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageEditorSave = async (editedFile: File) => {
    if (!user) return;
    
    setUploading(true);
    
    try {
      // Create temporary preview
      const objectUrl = URL.createObjectURL(editedFile);
      setPreviewUrl(objectUrl);

      // Generate unique filename
      const fileExt = editedFile.name.split('.').pop();
      const fileName = `featured-cards/${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('portfolio-images')
        .upload(fileName, editedFile);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('portfolio-images')
        .getPublicUrl(data.path);

      // Clean up temporary preview
      URL.revokeObjectURL(objectUrl);
      
      // Update with actual URL
      setPreviewUrl(urlData.publicUrl);
      onImageChange(urlData.publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      // Reset preview on error
      setPreviewUrl(currentImage || '');
    } finally {
      setUploading(false);
    }

    setSelectedFile(null);
    setShowImageEditor(false);
  };

  const handleImageEditorCancel = () => {
    setSelectedFile(null);
    setShowImageEditor(false);
  };

  const handleRemove = () => {
    setPreviewUrl('');
    onImageChange(null);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        // Simulate file input change
        const input = fileInputRef.current;
        if (input) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          input.files = dataTransfer.files;
          handleFileChange({ target: input } as React.ChangeEvent<HTMLInputElement>);
        }
      }
    }
  };

  const isLoading = uploading || isUploading;

  return (
    <div className={cn("space-y-2", className)}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <AspectRatio ratio={4/5} className="rounded-xl overflow-hidden">
        {previewUrl ? (
          <div className="relative w-full h-full">
            <img 
              src={previewUrl} 
              alt="Featured card preview" 
              className="w-full h-full object-cover"
              onError={() => {
                console.error('Failed to load image:', previewUrl);
                setPreviewUrl('');
              }}
            />
            <div className="absolute top-2 right-2 flex gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-full backdrop-blur-sm border-0 shadow-lg hover:scale-105 transition-transform" 
                onClick={handleButtonClick}
                disabled={isLoading}
                style={{
                  backgroundColor: `${themeColors.background}e6`,
                  color: themeColors.primary
                }}
                title="Edit image"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Edit className="h-4 w-4" />
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-full backdrop-blur-sm border-0 shadow-lg hover:scale-105 transition-transform text-red-500 hover:text-red-600" 
                onClick={handleRemove}
                disabled={isLoading}
                style={{
                  backgroundColor: `${themeColors.background}e6`
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div 
            className={cn(
              "w-full h-full flex flex-col items-center justify-center text-center p-6 cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 hover:scale-[1.02]",
              isDragOver && "scale-[1.02] shadow-lg"
            )}
            style={{
              backgroundColor: isDragOver ? `${themeColors.primary}10` : `${themeColors.background}80`,
              borderColor: isDragOver ? themeColors.primary : `${themeColors.border}60`
            }}
            onClick={handleButtonClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <p 
              className="text-xs mb-4" 
              style={{ color: themeColors.textSecondary }}
            >
              Drag & drop or click to browse
            </p>
            {isLoading && (
              <div className="mt-4 flex items-center gap-2">
                <Loader2 
                  className="h-4 w-4 animate-spin" 
                  style={{ color: themeColors.primary }}
                />
                <span 
                  className="text-sm" 
                  style={{ color: themeColors.primary }}
                >
                  Uploading...
                </span>
              </div>
            )}
          </div>
        )}
      </AspectRatio>

      {/* Image Editor Modal */}
      <ImageEditorModal
        open={showImageEditor}
        onOpenChange={setShowImageEditor}
        imageFile={selectedFile}
        aspectRatio={4/5}
        onSave={handleImageEditorSave}
        title="Edit Featured Card Image"
      />
    </div>
  );
};

export default FeaturedCardPhotoUploader;
