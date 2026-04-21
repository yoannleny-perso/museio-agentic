
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { PrimaryActionButton } from '@/components/ui/primary-action-button';
import CircularIcon from '@/components/ui/circular-icon';

interface HomeHeaderProps {
  onAddJob?: () => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ onAddJob }) => {
  const {
    jobs
  } = useAppContext();
  
  return (
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-[#A98CFF] to-[#6E59A5] bg-clip-text text-transparent">MUSEIO</h1>
      <PrimaryActionButton 
        onClick={onAddJob} 
        variant="soft"
        size="sm"
        className="shadow-sm"
      >
        <CircularIcon>
          <Plus className="h-2.5 w-2.5 text-[#9b87f5]" />
        </CircularIcon>
        <span>New Job</span>
      </PrimaryActionButton>
    </div>
  );
};
export default HomeHeader;
