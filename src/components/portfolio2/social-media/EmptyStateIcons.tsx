
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';

interface EmptyStateIconsProps {
  onShowAddMenu: () => void;
}

const EmptyStateIcons: React.FC<EmptyStateIconsProps> = ({
  onShowAddMenu
}) => {
  const { themeColors } = usePortfolioTheme();

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-4">
      <Button
        onClick={onShowAddMenu}
        variant="outline"
        className="flex items-center gap-2 px-4 py-2 border-2 border-dashed transition-colors"
        style={{
          borderColor: themeColors.border,
          color: themeColors.textSecondary,
          backgroundColor: 'transparent'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = themeColors.primary;
          e.currentTarget.style.backgroundColor = `${themeColors.primary}10`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = themeColors.border;
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Plus className="h-4 w-4" style={{ color: themeColors.textSecondary }} />
        Add Social Media
      </Button>
      
    </div>
  );
};

export default EmptyStateIcons;
