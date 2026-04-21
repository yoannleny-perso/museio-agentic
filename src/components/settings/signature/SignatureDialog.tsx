
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SignatureCanvas from './SignatureCanvas';
import TypedSignature from './TypedSignature';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface SignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (signature: string, type: 'drawn' | 'typed', originalText?: string) => Promise<boolean | void>;
  initialSignature?: string | null;
  initialType?: 'drawn' | 'typed';
  initialText?: string | null; // Added to pass original text for typed signatures
}

const SignatureDialog: React.FC<SignatureDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  initialSignature,
  initialType = 'drawn',
  initialText
}) => {
  const [activeTab, setActiveTab] = useState<'drawn' | 'typed'>(initialType);
  const isMobile = useIsMobile();
  
  const handleSaveDrawn = async (signatureDataUrl: string) => {
    console.log('SignatureDialog: Saving drawn signature');
    await onSave(signatureDataUrl, 'drawn');
    onOpenChange(false);
  };
  
  const handleSaveTyped = async (signatureImage: string, originalText: string) => {
    console.log('SignatureDialog: Saving typed signature with original text');
    await onSave(signatureImage, 'typed', originalText);
    onOpenChange(false);
  };
  
  const handleCancel = () => {
    console.log('SignatureDialog: Cancelling signature dialog');
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    console.log('SignatureDialog: Open state changing to:', newOpen);
    onOpenChange(newOpen);
  };

  // Determine the initial value for each tab
  const getInitialValue = (tabType: 'drawn' | 'typed') => {
    if (initialType === tabType) {
      if (tabType === 'typed') {
        // For typed signatures, use the original text if available, otherwise empty
        return initialText || '';
      } else {
        // For drawn signatures, use the signature image
        return initialSignature;
      }
    }
    return undefined;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className={cn(
          "sm:max-w-[550px] rounded-xl",
          isMobile && "w-[95vw] max-w-[95vw] p-3 pt-6"
        )}
      >
        <DialogHeader>
          <DialogTitle>Create Your Signature</DialogTitle>
          <DialogDescription>
            Choose between drawing your signature or typing it with a custom font.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs 
          defaultValue={activeTab} 
          onValueChange={(v) => setActiveTab(v as 'drawn' | 'typed')}
          className="w-full mt-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="drawn">Draw Signature</TabsTrigger>
            <TabsTrigger value="typed">Type Signature</TabsTrigger>
          </TabsList>
          
          <TabsContent value="drawn" className="mt-4">
            <SignatureCanvas 
              initialValue={getInitialValue('drawn')}
              onSave={handleSaveDrawn}
              onCancel={handleCancel}
            />
          </TabsContent>
          
          <TabsContent value="typed" className="mt-4">
            <TypedSignature 
              initialValue={getInitialValue('typed')}
              onSave={handleSaveTyped}
              onCancel={handleCancel}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SignatureDialog;
