
import React, { useEffect, useRef, useState } from 'react';
import { Camera, Upload, Trash2, Edit, Loader2 } from 'lucide-react';
import { useModedPortfolioPhoto } from '@/hooks/useModedPortfolioPhoto';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import Image from '@/components/ui/image';
import ImageEditorModal from './ImageEditorModal';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';

interface PortfolioPhotoSectionProps {
  isEditMode?: boolean;
  heroMode?: boolean;
  headerPhotoOverride?: string | null;
  uploadingOverride?: boolean;
  loadingOverride?: boolean;
  uploadPhotoOverride?: (file: File) => Promise<string | null>;
  deletePhotoOverride?: () => Promise<void> | void;
  fetchHeaderPhotoOverride?: () => Promise<void>;
}

const PortfolioPhotoSection: React.FC<PortfolioPhotoSectionProps> = ({
  isEditMode = false,
  heroMode = false,
  headerPhotoOverride,
  uploadingOverride,
  loadingOverride,
  uploadPhotoOverride,
  deletePhotoOverride,
  fetchHeaderPhotoOverride,
}) => {
  const sharedPhotoState = useModedPortfolioPhoto();
  const headerPhoto = headerPhotoOverride ?? sharedPhotoState.headerPhoto;
  const uploading = uploadingOverride ?? sharedPhotoState.uploading;
  const loading = loadingOverride ?? sharedPhotoState.loading;
  const fetchHeaderPhoto = fetchHeaderPhotoOverride ?? sharedPhotoState.fetchHeaderPhoto;
  const uploadPhoto = uploadPhotoOverride ?? sharedPhotoState.uploadPhoto;
  const deletePhoto = deletePhotoOverride ?? sharedPhotoState.deletePhoto;
  const { themeColors, isDarkTheme } = usePortfolioTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPreparingEditor, setIsPreparingEditor] = useState(false);
  const heroMaskGradient =
    'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 58%, rgba(0,0,0,0.98) 66%, rgba(0,0,0,0.88) 74%, rgba(0,0,0,0.58) 84%, rgba(0,0,0,0.22) 92%, rgba(0,0,0,0) 100%)';

  useEffect(() => {
    if (!fetchHeaderPhotoOverride) {
      fetchHeaderPhoto();
    }
  }, [fetchHeaderPhoto, fetchHeaderPhotoOverride]);

  const buildFileFromUrl = async (imageUrl: string) => {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error('Could not load the current profile photo for editing.');
    }

    const blob = await response.blob();
    const url = new URL(imageUrl);
    const extensionMatch = url.pathname.match(/\.([a-zA-Z0-9]+)$/);
    const extension = extensionMatch?.[1] || 'jpg';
    const mimeType = blob.type || `image/${extension === 'jpg' ? 'jpeg' : extension}`;

    return new File([blob], `portfolio-photo.${extension}`, {
      type: mimeType,
      lastModified: Date.now(),
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowImageEditor(true);
      // Reset the input value to allow selecting the same file again
      event.target.value = '';
    }
  };

  const handleImageEditorSave = async (editedFile: File) => {
    await uploadPhoto(editedFile);
    setSelectedFile(null);
    setShowImageEditor(false);
  };

  const handleImageEditorCancel = () => {
    setSelectedFile(null);
    setShowImageEditor(false);
  };

  const handleEditCurrentPhoto = async () => {
    if (!headerPhoto) {
      handleUploadClick();
      return;
    }

    try {
      setIsPreparingEditor(true);
      const existingPhotoFile = await buildFileFromUrl(headerPhoto);
      setSelectedFile(existingPhotoFile);
      setShowImageEditor(true);
    } catch (error) {
      console.error('Error preparing portfolio photo editor:', error);
      toast.error('Could not open the current photo for editing');
    } finally {
      setIsPreparingEditor(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setShowImageEditor(true);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  if (loading) {
    return (
      <div className="w-full md:mx-0 md:w-full">
        <AspectRatio ratio={4 / 5}>
          <div className="h-full w-full animate-pulse rounded-none bg-gray-200/80 md:rounded-[30px]" />
        </AspectRatio>
      </div>
    );
  }

  return (
    <div className="w-full md:mx-0 md:w-full">
      <AspectRatio ratio={4 / 5}>
        <div
          className={cn(
            "group relative h-full w-full rounded-none md:overflow-hidden md:rounded-[30px] md:shadow-[0_28px_70px_-42px_rgba(15,23,42,0.55)]",
            heroMode ? 'overflow-hidden' : 'overflow-visible',
            !headerPhoto &&
              isEditMode &&
              "border-2 border-dashed transition-colors"
          )}
          style={
            !headerPhoto && isEditMode
              ? {
                  borderColor: `${themeColors.primary}35`,
                  background:
                    isDarkTheme
                      ? `linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))`
                      : `linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.46))`,
                  borderRadius: heroMode ? '0px' : '26px',
                }
              : undefined
          }
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {headerPhoto ? (
            <>
              <Image
                src={headerPhoto}
                alt="Portfolio Header"
                className={cn(
                  "h-full w-full object-cover md:rounded-[30px]",
                  heroMode ? 'rounded-none object-center' : 'rounded-none'
                )}
                style={
                  heroMode
                    ? {
                        WebkitMaskImage: heroMaskGradient,
                        maskImage: heroMaskGradient,
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskSize: '100% 100%',
                        maskSize: '100% 100%',
                      }
                    : undefined
                }
                fallbackSrc="https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=500&fit=crop"
              />

              {!heroMode && (
                <div
                  className={cn(
                    "pointer-events-none absolute inset-x-0 bottom-[-1px]",
                    'h-[42%] md:h-[34%]'
                  )}
                  style={{
                    background: isDarkTheme
                      ? `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.10) 34%, ${themeColors.background} 82%, ${themeColors.background} 100%)`
                      : `linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.14) 28%, ${themeColors.background} 78%, ${themeColors.background} 100%)`,
                  }}
                />
              )}
              
              {/* Overlay with actions - only in edit mode */}
              {isEditMode && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleEditCurrentPhoto}
                    disabled={uploading || isPreparingEditor}
                    className="bg-white/90 hover:bg-white text-gray-900 text-xs px-3 py-2"
                  >
                    {isPreparingEditor ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Edit className="h-4 w-4 mr-1" />
                    )}
                    {isPreparingEditor ? 'Opening...' : 'Edit'}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={deletePhoto}
                    className="bg-gray-500/90 hover:bg-gray-600 text-white text-xs px-3 py-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : isEditMode ? (
            <div 
              className="flex h-full w-full cursor-pointer flex-col items-center justify-center px-8 py-12 text-center transition-colors hover:bg-white/25 md:px-6 md:py-8"
              onClick={handleUploadClick}
            >
              <div
                className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl shadow-[0_18px_40px_-26px_rgba(249,115,22,0.95)]"
                style={{
                  background: isDarkTheme
                    ? `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})`
                    : 'linear-gradient(135deg, #F59E0B, #F97316)',
                }}
              >
                <Upload className="h-8 w-8 text-white" />
              </div>

              <h3 className="mb-2 text-[28px] font-semibold tracking-tight text-[#1F2430]">
                Add Portrait Photo
              </h3>
              <p className="mx-auto mb-4 max-w-[250px] text-base leading-6 text-[#6B7280]">
                Upload a professional portrait to showcase your profile
              </p>
              <div className="rounded-full border px-4 py-2 text-sm font-medium"
                style={{
                  borderColor: isDarkTheme ? `${themeColors.border}` : 'rgba(249,115,22,0.35)',
                  color: isDarkTheme ? themeColors.textSecondary : '#7A7F8C',
                  backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.75)',
                }}
              >
                4:5 ratio recommended
              </div>
              <p className="mt-5 text-sm text-[#8A90A0]">
                Click to upload or drag and drop
              </p>
            </div>
          ) : (
            // In live mode with no photo, show placeholder
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)' }}
            >
              <div className="text-center text-gray-400">
                <Camera className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">No photo</p>
              </div>
            </div>
          )}

          {(uploading || isPreparingEditor) && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-white rounded-lg p-3 flex items-center gap-3">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#8B5CF6]"></div>
                <span className="text-xs font-medium">
                  {isPreparingEditor ? 'Opening editor...' : 'Uploading...'}
                </span>
              </div>
            </div>
          )}
        </div>
      </AspectRatio>

      {/* File input - only in edit mode */}
      {isEditMode && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      )}

      {/* Image Editor Modal */}
      <ImageEditorModal
        open={showImageEditor}
        onOpenChange={setShowImageEditor}
        imageFile={selectedFile}
        aspectRatio={4/5}
        onSave={handleImageEditorSave}
        title="Edit Portfolio Photo"
        secondaryActionLabel={headerPhoto ? 'Upload Different Image' : undefined}
        onSecondaryAction={headerPhoto ? handleUploadClick : undefined}
        secondaryActionDisabled={uploading}
      />
    </div>
  );
};

export default PortfolioPhotoSection;
