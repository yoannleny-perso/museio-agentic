
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SectionTypeSelector from './SectionTypeSelector';
import { useModedPortfolioSections, SectionConfig } from '@/hooks/useModedPortfolioSections';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';
import { toast } from 'sonner';

const AddSectionButton: React.FC = () => {
  const [showSelector, setShowSelector] = useState(false);
  const { addSection } = useModedPortfolioSections();
  const { themeColors } = usePortfolioTheme();

  const handleAddSection = async (type: SectionConfig['type']) => {
    const success = await addSection(type);
    if (success) {
      toast.success('Section added successfully');
    } else {
      toast.error('Failed to add section');
    }
  };

  return (
    <>
      <div className="flex justify-center my-6">
        <Button
          onClick={() => setShowSelector(true)}
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
          Add New Section
        </Button>
      </div>
      
      <SectionTypeSelector
        isOpen={showSelector}
        onClose={() => setShowSelector(false)}
        onSelect={handleAddSection}
      />
    </>
  );
};

export default AddSectionButton;
