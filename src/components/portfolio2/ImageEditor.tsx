import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface ImageEditorProps {
  imageFile: File;
  aspectRatio?: number;
  onSave: (editedFile: File) => void;
  onCancel: () => void;
  className?: string;
}

interface LoadedImage {
  element: HTMLImageElement;
  src: string;
  width: number;
  height: number;
}

interface Position {
  x: number;
  y: number;
}

const VIEWPORT_WIDTH = 360;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const ImageEditor: React.FC<ImageEditorProps> = ({
  imageFile,
  aspectRatio = 4 / 5,
  onSave,
  onCancel,
  className,
}) => {
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const [imageData, setImageData] = useState<LoadedImage | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const viewportHeight = useMemo(
    () => Math.round(VIEWPORT_WIDTH / aspectRatio),
    [aspectRatio]
  );

  const normalizedRotation = useMemo(
    () => ((rotation % 360) + 360) % 360,
    [rotation]
  );

  const rotatedDimensions = useMemo(() => {
    if (!imageData) {
      return { width: 0, height: 0 };
    }

    const isQuarterTurn = normalizedRotation === 90 || normalizedRotation === 270;

    return {
      width: isQuarterTurn ? imageData.height : imageData.width,
      height: isQuarterTurn ? imageData.width : imageData.height,
    };
  }, [imageData, normalizedRotation]);

  const coverScale = useMemo(() => {
    if (!rotatedDimensions.width || !rotatedDimensions.height) {
      return 1;
    }

    return Math.max(
      VIEWPORT_WIDTH / rotatedDimensions.width,
      viewportHeight / rotatedDimensions.height
    );
  }, [rotatedDimensions, viewportHeight]);

  const displayScale = useMemo(
    () => coverScale * zoomLevel,
    [coverScale, zoomLevel]
  );

  const clampPosition = useCallback(
    (nextPosition: Position, nextScale = displayScale) => {
      if (!rotatedDimensions.width || !rotatedDimensions.height) {
        return nextPosition;
      }

      const displayedWidth = rotatedDimensions.width * nextScale;
      const displayedHeight = rotatedDimensions.height * nextScale;

      const maxX = Math.max(0, (displayedWidth - VIEWPORT_WIDTH) / 2);
      const maxY = Math.max(0, (displayedHeight - viewportHeight) / 2);

      return {
        x: clamp(nextPosition.x, -maxX, maxX),
        y: clamp(nextPosition.y, -maxY, maxY),
      };
    },
    [displayScale, rotatedDimensions, viewportHeight]
  );

  useEffect(() => {
    setPosition((currentPosition) => clampPosition(currentPosition));
  }, [clampPosition]);

  useEffect(() => {
    let isMounted = true;

    const cleanupObjectUrl = () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };

    const loadImage = async () => {
      setError(null);
      setIsLoading(true);
      setImageData(null);
      setZoomLevel(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });

      cleanupObjectUrl();

      try {
        const objectUrl = URL.createObjectURL(imageFile);
        objectUrlRef.current = objectUrl;

        const imageElement = new window.Image();
        imageElement.decoding = 'async';

        await new Promise<void>((resolve, reject) => {
          imageElement.onload = () => resolve();
          imageElement.onerror = () =>
            reject(
              new Error('This image format could not be loaded. Please try a JPG, PNG, or WebP image.')
            );
          imageElement.src = objectUrl;
        });

        if (!isMounted) {
          cleanupObjectUrl();
          return;
        }

        setImageData({
          element: imageElement,
          src: objectUrl,
          width: imageElement.naturalWidth || imageElement.width,
          height: imageElement.naturalHeight || imageElement.height,
        });
      } catch (err) {
        console.error('Image load failed:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'This image could not be loaded. Please try a different photo.'
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadImage();

    return () => {
      isMounted = false;
      cleanupObjectUrl();
    };
  }, [imageFile]);

  const updateZoom = useCallback(
    (nextZoom: number) => {
      const clampedZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
      const nextScale = coverScale * clampedZoom;

      setZoomLevel(clampedZoom);
      setPosition((currentPosition) => clampPosition(currentPosition, nextScale));
    },
    [clampPosition, coverScale]
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!imageData || isLoading || error) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    setPosition(
      clampPosition({
        x: dragState.originX + deltaX,
        y: dragState.originY + deltaY,
      })
    );
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStateRef.current?.pointerId === event.pointerId) {
      dragStateRef.current = null;
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
  };

  const handleRotate = (direction: 'left' | 'right') => {
    setRotation((currentRotation) =>
      direction === 'right' ? currentRotation + 90 : currentRotation - 90
    );
  };

  const handleSave = async () => {
    if (!imageData) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const exportWidth = 1200;
      const exportHeight = Math.round(exportWidth / aspectRatio);
      const viewportToExportRatio = exportWidth / VIEWPORT_WIDTH;

      const canvas = document.createElement('canvas');
      canvas.width = exportWidth;
      canvas.height = exportHeight;

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Could not initialize image export.');
      }

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, exportWidth, exportHeight);
      context.save();
      context.translate(
        exportWidth / 2 + position.x * viewportToExportRatio,
        exportHeight / 2 + position.y * viewportToExportRatio
      );
      context.rotate((normalizedRotation * Math.PI) / 180);
      context.scale(displayScale * viewportToExportRatio, displayScale * viewportToExportRatio);
      context.drawImage(
        imageData.element,
        -imageData.width / 2,
        -imageData.height / 2,
        imageData.width,
        imageData.height
      );
      context.restore();

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (result) {
              resolve(result);
            } else {
              reject(new Error('Could not export the edited image.'));
            }
          },
          'image/jpeg',
          0.92
        );
      });

      const baseName = imageFile.name.replace(/\.[^.]+$/, '') || 'portfolio-photo';
      const editedFile = new File([blob], `${baseName}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      onSave(editedFile);
    } catch (err) {
      console.error('Image save failed:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'We could not process this image. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-4', className)} style={{ maxWidth: '400px', width: '95%' }}>
      <div
        className="relative overflow-hidden rounded-[32px] bg-white shadow-2xl"
        style={{ width: '100%', aspectRatio: `${aspectRatio}` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: '#ffffff',
            backgroundImage:
              'linear-gradient(to right, rgba(148, 163, 184, 0.28) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.28) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />

        {imageData ? (
          <img
            src={imageData.src}
            alt="Portfolio preview"
            draggable={false}
            className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
            style={{
              width: imageData.width,
              height: imageData.height,
              transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) rotate(${normalizedRotation}deg) scale(${displayScale})`,
              transformOrigin: 'center center',
              willChange: 'transform',
            }}
          />
        ) : null}

        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm text-slate-500">
            Initializing Editor...
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="space-y-4">
          <div className="rounded-[28px] border border-red-200 bg-red-50 px-4 py-5 text-center text-sm text-red-600">
            {error}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onCancel} disabled={isProcessing} className="text-black">
              Close
            </Button>
          </div>
        </div>
      ) : !isLoading && imageData ? (
        <div className="flex flex-col gap-4">
          <p className="text-center text-sm text-muted-foreground">
            Drag to reposition. Use the controls below to zoom or rotate.
          </p>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Zoom</label>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                onClick={() => updateZoom(zoomLevel - ZOOM_STEP)}
                disabled={zoomLevel <= MIN_ZOOM}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Slider
                value={[zoomLevel]}
                onValueChange={(value) => updateZoom(value[0])}
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={ZOOM_STEP}
                className="flex-1"
              />
              <Button
                size="icon"
                onClick={() => updateZoom(zoomLevel + ZOOM_STEP)}
                disabled={zoomLevel >= MAX_ZOOM}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Rotate</label>
            <div className="flex items-center gap-2">
              <Button onClick={() => handleRotate('left')}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Left
              </Button>
              <Button onClick={() => handleRotate('right')}>
                <RotateCw className="mr-2 h-4 w-4" />
                Right
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onCancel} disabled={isProcessing} className="text-black">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Save Image'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ImageEditor;
