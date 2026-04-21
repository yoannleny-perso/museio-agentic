import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2 } from 'lucide-react';
import Image from '@/components/ui/image';
import { cn } from '@/lib/utils';

interface LogoUploaderProps {
  currentLogo: string;
  onLogoChange: (file: File | null) => void;
  onLogoSelected: (url: string) => void;
  onLogoRemove: () => void;
  isUploading: boolean;
}

const LogoUploader: React.FC<LogoUploaderProps> = ({
  currentLogo,
  onLogoChange,
  onLogoSelected,
  onLogoRemove,
  isUploading
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(currentLogo);
  const [tempObjectUrl, setTempObjectUrl] = useState<string | null>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (!file) {
      //console.log("No file selected");
      return;
    }

    // Clean up previous temp object URL
    if (tempObjectUrl) {
      //console.log("Cleaning up previous temp object URL:", tempObjectUrl);
      URL.revokeObjectURL(tempObjectUrl);
      setTempObjectUrl(null);
    }

    // Create temporary preview URL and update preview immediately
    const objectUrl = URL.createObjectURL(file);
    setTempObjectUrl(objectUrl);
    setPreviewUrl(objectUrl);

    //console.log("Selected file:", {
    //  name: file.name,
    //  size: file.size,
    //  type: file.type
    //});
    //console.log("Preview URL set to temp:", objectUrl);
    
    // Reset the file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Call parent callback for actual upload
    onLogoChange(file);
  };

  // Handle file input click
  const handleButtonClick = () => {
    //console.log("File input button clicked 2" );
    setPreviewUrl('');
    onLogoRemove();
    fileInputRef.current?.click();
  };

  // Handle logo removal with cleanup
  const handleRemoveClick = () => {
    //console.log("Remove button clicked");
    
    // Clean up temp object URL if it exists
    if (tempObjectUrl) {
      //console.log("Cleaning up temp object URL on remove:", tempObjectUrl);
      URL.revokeObjectURL(tempObjectUrl);
      setTempObjectUrl(null);
    }
    
    // Clear preview and call parent handler
    setPreviewUrl('');
    onLogoRemove();
  };

  // Update preview when currentLogo changes (successful upload)
  React.useEffect(() => {
    //console.log("Current logo updated:", currentLogo);
    
    if (currentLogo && currentLogo !== previewUrl && !currentLogo.startsWith('blob:')) {
      //console.log("Setting preview URL to currentLogo:", currentLogo);
      
      // Clean up temp object URL since we have a permanent URL now
      if (tempObjectUrl) {
        //console.log("Cleaning up temp object URL, got permanent URL:", tempObjectUrl);
        URL.revokeObjectURL(tempObjectUrl);
        setTempObjectUrl(null);
      }
      
      setPreviewUrl(currentLogo);
    } else if (!currentLogo && !tempObjectUrl) {
      // Logo was removed and no temp preview exists
      //console.log("Logo removed from form, clearing preview");
      setPreviewUrl('');
    }
  }, [currentLogo, tempObjectUrl, previewUrl]);

  // Cleanup effect for component unmount
  React.useEffect(() => {
    return () => {
      if (tempObjectUrl) {
        //console.log("Component unmounting, cleaning up temp object URL:", tempObjectUrl);
        URL.revokeObjectURL(tempObjectUrl);
      }
    };
  }, [tempObjectUrl]);

  return (
    <div className="space-y-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {previewUrl ? (
        <div className="relative w-full border rounded-lg overflow-hidden">
          <div className="aspect-[3/1] bg-gray-100 flex items-center justify-center">
            <img 
              src={previewUrl} 
              alt="Logo Preview" 
              className="max-h-full max-w-full object-contain"
              onLoad={() => {
                //console.log("Logo image loaded successfully:", previewUrl)
                }
              }
              onError={(e) => {
                //console.error("Logo image failed to load:", previewUrl, e);
                // If temp URL failed to load and we have a current logo, revert to it
                if (previewUrl.startsWith('blob:') && currentLogo && currentLogo !== previewUrl) {
                  //console.log("Temp URL failed, reverting to current logo:", currentLogo);
                  setPreviewUrl(currentLogo);
                }
              }}
            />
          </div>
          <div className="absolute top-2 right-2 flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 w-8 p-0 rounded-full bg-white text-gray-700 hover:bg-gray-200" 
            onClick={handleButtonClick}
            disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              <span className="sr-only">Change Logo</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 w-8 p-0 rounded-full bg-white text-red-600 hover:bg-red-50 border-red-200" 
              onClick={handleRemoveClick}
              disabled={isUploading}
            >
              <X size={16} />
              <span className="sr-only">Remove Logo</span>
            </Button>
          </div>
          
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <Upload className="h-5 w-5 text-gray-500" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Click to upload your logo</p>
            <p className="text-xs text-gray-500 mt-1">
              SVG, PNG, JPG or GIF (max 2MB)
            </p>
          </div>
          <Button 
            type="button" 
            variant="outline" 
            className={cn("mt-2", isUploading && "opacity-80")}
            onClick={handleButtonClick}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                Uploading...
              </>
            ) : (
              <>Select Logo</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default LogoUploader;
