
import React, { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { usePortfolioTheme, GRADIENT_PRESETS } from '@/hooks/usePortfolioTheme';
import { toast } from 'sonner';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

const BackgroundGradientSelector: React.FC = () => {
  const { selectedGradient, updateBackgroundGradient, loading, layoutPreferences } = usePortfolioTheme();
  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedForUpdate, setSelectedForUpdate] = useState<string | null>(null);

  const handleGradientSelect = async (gradientId: string) => {
    if (gradientId === selectedGradient) {
      setOpen(false);
      return;
    }

    setIsUpdating(true);
    setSelectedForUpdate(gradientId);
    toast.dismiss(); // Clear any existing toasts immediately

    try {
      await updateBackgroundGradient(gradientId);
      
      // Show selected state for 500ms before closing
      setTimeout(() => {
        setOpen(false);
        setIsUpdating(false);
        setSelectedForUpdate(null);
        toast.success('Background updated successfully');
      }, 500);
    } catch (error) {
      console.error('Failed to update background:', error);
      setIsUpdating(false);
      setSelectedForUpdate(null);
      toast.error('Failed to update background');
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          className="absolute top-2 left-2 z-10 p-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          disabled={loading || isUpdating}
        >
          <Palette className="h-4 w-4 text-[#8B5CF6]" />
        </button>
      </DrawerTrigger>
      <DrawerContent 
        className="mx-auto"
        style={{ 
          maxWidth: layoutPreferences.max_width || '400px',
          width: '100%'
        }}
      >
        <DrawerHeader>
          <DrawerTitle>Choose Background Style</DrawerTitle>
        </DrawerHeader>
        <div className="p-4 pb-8">
          <div className="grid grid-cols-2 gap-3">
            {GRADIENT_PRESETS.map((gradient) => {
              const isDark = ['dark-purple', 'dark-blue', 'dark-navy', 'dark-emerald', 'dark-rose'].includes(gradient.id);
              const isSelected = selectedGradient === gradient.id;
              const isBeingSelected = selectedForUpdate === gradient.id;
              const showLoadingState = isUpdating && isBeingSelected;
              
              return (
                <button
                  key={gradient.id}
                  onClick={() => handleGradientSelect(gradient.id)}
                  disabled={isUpdating}
                  className={`relative h-20 rounded-xl border-2 transition-all duration-300 transform ${
                    isSelected
                      ? 'border-[#8B5CF6] ring-2 ring-[#8B5CF6]/20 scale-105'
                      : 'border-gray-200 hover:border-gray-300 hover:scale-105'
                  } ${
                    showLoadingState 
                      ? 'animate-pulse border-[#8B5CF6] ring-2 ring-[#8B5CF6]/40' 
                      : ''
                  } ${
                    isUpdating && !isBeingSelected 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:shadow-lg'
                  } ${gradient.gradient}`}
                >
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/10 to-transparent" />
                  
                  {/* Gradient name */}
                  <div className="absolute bottom-2 left-2 right-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full transition-all duration-200 ${
                      isDark 
                        ? 'text-white bg-white/20 backdrop-blur-sm' 
                        : 'text-gray-700 bg-white/80 backdrop-blur-sm'
                    }`}>
                      {gradient.name}
                    </span>
                  </div>
                  
                  {/* Selection indicator */}
                  {(isSelected || showLoadingState) && (
                    <div className="absolute top-2 right-2">
                      <div className={`h-6 w-6 bg-[#8B5CF6] rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                        showLoadingState ? 'animate-spin' : 'animate-scale-in'
                      }`}>
                        {showLoadingState ? (
                          <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Overlay for loading state */}
                  {showLoadingState && (
                    <div className="absolute inset-0 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-white text-xs font-medium bg-black/30 px-2 py-1 rounded-full">
                        Applying...
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          
          {isUpdating && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 animate-pulse">
                Updating background style...
              </p>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default BackgroundGradientSelector;
