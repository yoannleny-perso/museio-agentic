import React from 'react';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';

interface SectionSeparatorProps {
  className?: string;
}

const SectionSeparator: React.FC<SectionSeparatorProps> = ({ className = '' }) => {
  const { themeColors, isDarkTheme } = usePortfolioTheme();

  return (
    <div className={`flex justify-center py-6 ${className}`}>
      <div 
        className="h-px rounded-full transition-colors duration-300"
        style={{
          width: '85%',
          backgroundColor: isDarkTheme() 
            ? 'rgba(255, 255, 255, 0.15)' 
            : 'rgba(0, 0, 0, 0.08)',
          opacity: 0.6
        }}
      />
    </div>
  );
};

export default SectionSeparator;