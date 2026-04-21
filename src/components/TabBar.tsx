
import React, { useMemo } from 'react';
import { Calendar, Menu, MoreHorizontal, Wallet, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';
import { TabType } from '@/types';

interface TabBarProps {
  onMoreClick?: () => void;
  onTabClick?: (tab: TabType) => void;
}

const TabBar: React.FC<TabBarProps> = ({ onMoreClick, onTabClick }) => {
  const {
    activeTab,
    jobs
  } = useAppContext();

  // Calculate if there are any past jobs requiring attention (completed jobs)
  const hasPastJobs = useMemo(() => {
    if (!jobs || jobs.length === 0) return false;
    return jobs.some(job => job.status === 'past');
  }, [jobs]);

  const tabs: {
    id: TabType;
    icon: React.ElementType;
    label: string;
  }[] = [{
    id: 'home',
    icon: Calendar,
    label: 'Home'
  }, {
    id: 'jobs',
    icon: Menu,
    label: 'Jobs'
  }, {
    id: 'portfolio',
    icon: User,
    label: 'Portfolio'
  }, {
    id: 'finance',
    icon: Wallet,
    label: 'Finance'
  }, {
    id: 'more',
    icon: MoreHorizontal,
    label: 'More'
  }];

  // Handle tab click
  const handleTabClick = (tab: TabType, event: React.MouseEvent) => {
    event.preventDefault();
    
    // Special handling for "More" tab - show drawer instead of navigating
    if (tab === 'more') {
      onMoreClick?.();
      return;
    }
    
    const scrollContainer = document.getElementById('main-scroll-container');
  if (scrollContainer) {
    scrollContainer.scrollTo({ top: 0, behavior: 'auto' });
  } else {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
    // Use the navigation handler from Layout
    onTabClick?.(tab);
  };

  return (
  <nav className="tabbar-container"> 
    <div className="tabbar-content">
        <div className="grid h-full grid-cols-5 bg-gradient-to-br from-[#F8F7FF] to-[rgba(255,255,255,0.85)] px-1">
          {tabs.map(tab => (
            <button
              key={tab.id} 
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 rounded-[1.15rem] bg-transparent transition-colors duration-200',
                activeTab === tab.id 
                  ? 'text-[#8B5CF6]' 
                  : 'text-gray-400 hover:text-gray-600'
              )}
              onClick={e => handleTabClick(tab.id, e)}
            >
              <div className="relative flex items-center justify-center h-6 w-6">
                {/* Notification Badge for Jobs Tab */}
                {tab.id === 'jobs' && hasPastJobs && (
                  <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#8B5CF6] animate-pulse"></div>
                  </div>
                )}
                
                <tab.icon className={cn(
                  'h-5 w-5 text-current',
                  activeTab === tab.id 
                    ? 'text-[#8B5CF6]' 
                    : 'text-gray-400'
                )} />
              </div>
              <span className={cn(
                'mt-0.5 block w-full text-center text-[11px] font-medium leading-none sm:text-xs',
                activeTab === tab.id && 'font-semibold'
              )}>
                {tab.label}
              </span>
              {activeTab === tab.id && (
                <div className="absolute top-0 h-0.5 w-10 bg-gradient-to-r from-[#8B5CF6] to-[#6E59A5] rounded-full transform -translate-y-[1px]" />
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default TabBar;
