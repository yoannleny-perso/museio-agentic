
import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface SignatureCanvasProps {
  initialValue?: string | null;
  onSave: (signatureDataUrl: string) => void;
  onCancel: () => void;
  className?: string;
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({ 
  initialValue, 
  onSave, 
  onCancel,
  className 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<import('fabric').Canvas | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const isMobile = useIsMobile();

  // Calculate appropriate canvas dimensions
  const setupCanvasDimensions = () => {
    if (!containerRef.current || !fabricRef.current) return;
    
    const containerWidth = containerRef.current.clientWidth;
    // Set height proportional to width with a reasonable aspect ratio
    const canvasHeight = Math.min(200, containerWidth * 0.5);
    
    fabricRef.current.setDimensions({
      width: containerWidth,
      height: canvasHeight
    });
    fabricRef.current.renderAll();
  };

  // Initialize fabric canvas
  useEffect(() => {
    let isMounted = true;

    const initializeCanvas = async () => {
      if (!canvasRef.current || fabricRef.current) {
        return;
      }

      const Fabric = await import('fabric');
      if (!isMounted || !canvasRef.current) {
        return;
      }

      const canvas = new Fabric.Canvas(canvasRef.current, {
        isDrawingMode: true,
        backgroundColor: '#ffffff',
      });

      canvas.freeDrawingBrush.color = '#000000';
      canvas.freeDrawingBrush.width = isMobile ? 3 : 2;
      canvas.enablePointerEvents = true;

      fabricRef.current = canvas;

      canvas.on('path:created', () => {
        setIsEmpty(false);
      });

      if (initialValue && initialValue.startsWith('data:image')) {
        try {
          Fabric.FabricImage.fromURL(initialValue)
            .then((img) => {
              if (!isMounted) return;
              canvas.clear();
              canvas.add(img);
              canvas.renderAll();
              setIsEmpty(false);
            })
            .catch((err) => {
              console.error('Failed to load initial signature:', err);
            });
        } catch (err) {
          console.error('Failed to load initial signature:', err);
        }
      }

      setupCanvasDimensions();
    };

    void initializeCanvas();

    return () => {
      isMounted = false;
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
    };
  }, [initialValue, isMobile]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setupCanvasDimensions();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle save signature
  const handleSave = async () => {
    if (!fabricRef.current || isEmpty) return;
    
    setIsSaving(true);
    try {
      const dataUrl = fabricRef.current.toDataURL({
        multiplier: 1,
        format: 'png',
        quality: 1
      });
      onSave(dataUrl);
    } catch (err) {
      console.error('Error saving signature:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Clear the canvas
  const handleClear = () => {
    if (!fabricRef.current) return;
    fabricRef.current.clear();
    fabricRef.current.backgroundColor = '#f9fafb';
    fabricRef.current.renderAll();
    setIsEmpty(true);
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div 
        ref={containerRef}
        className="border border-gray-300 rounded-md overflow-hidden w-full"
      >
        <canvas ref={canvasRef} />
      </div>
      <p className="text-sm text-gray-500">Draw your signature above</p>
      
      {/* Responsive button layout */}
      <div className={cn(
        "flex gap-2 mt-2", 
        isMobile ? "flex-col w-full" : "flex-row"
      )}>
        <Button 
          variant="secondary" 
          onClick={handleClear}
          disabled={isEmpty}
          className={isMobile ? "w-full" : ""}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear
        </Button>
        
        <div className={cn(
          "flex gap-2",
          isMobile ? "w-full mt-2" : ""
        )}>
          <Button
            variant="secondary"
            onClick={onCancel}
            className={isMobile ? "flex-1" : ""}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isEmpty || isSaving}
            className={isMobile ? "flex-1" : ""}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignatureCanvas;
