
import React, { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { renderSignatureToCanvas, getFontClassName } from '@/utils/signatureRenderer';

interface TypedSignatureProps {
  initialValue?: string | null;
  onSave: (signatureData: string, originalText: string) => void;
  onCancel: () => void;
  className?: string;
}

const fonts = [
  { value: 'font-signature', label: 'Signature' },
  { value: 'font-serif', label: 'Formal' },
  { value: 'font-cursive', label: 'Handwritten' },
];

const TypedSignature: React.FC<TypedSignatureProps> = ({ 
  initialValue, 
  onSave, 
  onCancel, 
  className 
}) => {
  // Initialize with original text, not base64 image
  const getInitialText = (value?: string | null): string => {
    if (!value) return '';
    // If the value starts with 'data:image', it's a base64 image, so return empty string
    // The actual text will come from the signature_text field via the parent component
    if (value.startsWith('data:image')) return '';
    return value;
  };

  const [signatureText, setSignatureText] = useState(getInitialText(initialValue));
  const [selectedFont, setSelectedFont] = useState('font-signature');
  const [isSaving, setIsSaving] = useState(false);
  const [renderedSignature, setRenderedSignature] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  // Render signature when text or font changes
  useEffect(() => {
    if (signatureText.trim()) {
      const fontClassName = getFontClassName(selectedFont);
      renderSignatureToCanvas(signatureText, fontClassName)
        .then(setRenderedSignature)
        .catch(console.error);
    } else {
      setRenderedSignature(null);
    }
  }, [signatureText, selectedFont]);
  
  const handleSave = async () => {
    if (!signatureText.trim()) return;
    
    setIsSaving(true);
    try {
      // Render the signature as an image
      const fontClassName = getFontClassName(selectedFont);
      const imageData = await renderSignatureToCanvas(signatureText, fontClassName);
      // Pass both the rendered image and the original text
      onSave(imageData, signatureText);
    } catch (error) {
      console.error('Error rendering signature:', error);
      // Fallback to text if rendering fails
      onSave(signatureText, signatureText);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={cn("flex flex-col space-y-4", className)}>
      <div className="space-y-2">
        <Label htmlFor="signature-text">Type your name</Label>
        <Input
          id="signature-text"
          value={signatureText}
          onChange={(e) => setSignatureText(e.target.value)}
          placeholder="Your signature"
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="signature-font">Choose a font style</Label>
        <Select
          value={selectedFont}
          onValueChange={setSelectedFont}
        >
          <SelectTrigger id="signature-font" className="w-full">
            <SelectValue placeholder="Select font" />
          </SelectTrigger>
          <SelectContent>
            {fonts.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                {font.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="border rounded-md p-6 bg-gray-50 flex items-center justify-center min-h-[100px]">
        {renderedSignature ? (
          <img 
            src={renderedSignature} 
            alt="Signature preview" 
            className="h-16 object-contain"
          />
        ) : signatureText ? (
          <p className={`text-xl ${selectedFont}`}>{signatureText}</p>
        ) : (
          <p className="text-gray-400">Your signature will appear here</p>
        )}
      </div>
      
      <div className={cn(
        "flex gap-2 mt-4",
        isMobile ? "flex-col" : "justify-end"
      )}>
        <Button 
          variant="secondary" 
          onClick={onCancel}
          className={isMobile ? "w-full" : ""}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!signatureText.trim() || isSaving}
          className={isMobile ? "w-full" : ""}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Signature
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default TypedSignature;
