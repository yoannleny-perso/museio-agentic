
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Signature } from 'lucide-react';
import SignatureDialog from './SignatureDialog';
import { cn } from '@/lib/utils';

interface SignatureFieldProps {
  signature: string | null;
  signatureType: 'drawn' | 'typed' | null;
  signatureText?: string | null;
  onSave: (signature: string, type: 'drawn' | 'typed', originalText?: string) => Promise<boolean | void>;
  onRemove: () => Promise<boolean | void>;
  className?: string;
  displayUrl?: string; // Add displayUrl prop for signed URLs
}

const SignatureField: React.FC<SignatureFieldProps> = ({
  signature,
  signatureType,
  signatureText,
  onSave,
  onRemove,
  className,
  displayUrl
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  
  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('SignatureField: Remove button clicked');
    
    setIsRemoving(true);
    try {
      await onRemove();
    } catch (err) {
      console.error('Error removing signature:', err);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('SignatureField: Edit button clicked, opening dialog');
    setIsDialogOpen(true);
  };

  const handleAddSignature = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('SignatureField: Add Signature button clicked, opening dialog');
    setIsDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    console.log('SignatureField: Dialog open change to:', open);
    setIsDialogOpen(open);
  };
  
  // Use displayUrl if available, otherwise fall back to signature
  const imageUrl = displayUrl || signature;
  
  return (
    <div className={cn("space-y-4", className)}>
      {imageUrl ? (
        <div className="flex flex-col items-center">
          <div className="border border-gray-200 rounded-md p-4 bg-gray-50 w-full max-w-[400px]">
            <img 
              src={imageUrl} 
              alt="Your signature" 
              className="h-16 object-contain mx-auto"
              onError={(e) => {
                console.error('Failed to load signature image:', imageUrl);
                // Fallback: hide the image if it fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleEdit}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              type="button"
              variant="soft-destructive"
              size="sm"
              onClick={handleRemove}
              disabled={isRemoving}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-md p-8 bg-gray-50">
          <Signature className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-gray-500 mb-4">No signature added yet</p>
          <Button 
            type="button"
            onClick={handleAddSignature}
          >
            Add Signature
          </Button>
        </div>
      )}
      
      <SignatureDialog
        open={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        onSave={onSave}
        initialSignature={signature}
        initialType={signatureType || 'drawn'}
        initialText={signatureText}
      />
    </div>
  );
};

export default SignatureField;
