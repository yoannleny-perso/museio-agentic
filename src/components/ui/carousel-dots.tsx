import React from 'react';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';

interface CarouselDotsProps {
  totalSlides: number;
  currentSlide: number;
  onSlideSelect: (index: number) => void;
  className?: string;
}

const CarouselDots: React.FC<CarouselDotsProps> = ({
  totalSlides,
  currentSlide,
  onSlideSelect,
  className = ""
}) => {
  const { themeColors } = usePortfolioTheme();

  if (totalSlides <= 1) return null;

  return (
    <div className={`flex justify-center gap-2 mt-4 ${className}`}>
      {Array.from({ length: totalSlides }).map((_, index) => (
        <button
          key={index}
          onClick={() => onSlideSelect(index)}
          className="w-2 h-2 rounded-full cursor-pointer transition-all duration-200 hover:scale-110"
          style={{
            backgroundColor: index === currentSlide 
              ? themeColors.textSecondary 
              : `${themeColors.primary}`,
          }}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
};

export default CarouselDots;