
import React from 'react';
import { Plus, Menu, Wallet, MoreHorizontal, Search, Users, Settings, Calendar } from 'lucide-react';
import PortfolioHeaderControls from '@/components/portfolio2/PortfolioHeaderControls';
import { PrimaryActionButton } from '@/components/ui/primary-action-button';
import CircularIcon from '@/components/ui/circular-icon';
import { Input } from '@/components/ui/input';
import { ProfileDropdown } from '@/components/ui/profile-dropdown';
import { useAppContext } from '@/context/AppContext';
import { useJobsContext } from '@/context/JobsContext';
import { Capacitor } from '@capacitor/core';
import { useLocation } from 'react-router-dom';

interface AppHeaderProps {
  onAddJob?: () => void;
  onAddClient?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onAddJob, onAddClient }) => {
  const { activeTab } = useAppContext();
  const { searchQuery, setSearchQuery } = useJobsContext();
  const location = useLocation();
  const isNative = Capacitor.isNativePlatform();
  const headerShellClassName =
    location.pathname === '/app/availability' || location.pathname === '/app/portfolio'
      ? 'app-header-shell-wide'
      : 'app-header-shell';

  const renderContent = () => {
    // Handle settings page specifically
    if (location.pathname === '/app/settings') {
      return (
        <div className={`flex items-center justify-between ${isNative ? 'pt-4' : ''}`}>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-50 to-purple-100">
              <Settings className="h-5 w-5 text-[#9b87f5]" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#A98CFF] to-[#6E59A5] bg-clip-text text-transparent">Settings</h1>
          </div>
          <ProfileDropdown />
        </div>
      );
    }
    
    // Handle clients page specifically
    if (location.pathname === '/app/clients') {
      return (
        <div className={`flex items-center justify-between ${isNative ? 'pt-4' : ''}`}>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-50 to-purple-100">
              <Users className="h-5 w-5 text-[#9b87f5]" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#A98CFF] to-[#6E59A5] bg-clip-text text-transparent">Clients</h1>
          </div>
          <PrimaryActionButton 
            onClick={onAddClient} 
            variant="soft"
            size="sm"
            className="shadow-sm"
          >
            <CircularIcon>
              <Plus className="h-2.5 w-2.5 text-[#9b87f5]" />
            </CircularIcon>
          </PrimaryActionButton>
        </div>
      );
    }

    // Handle availability page specifically
    if (location.pathname === '/app/availability') {
      return (
        <div className={`flex items-center justify-between ${isNative ? 'pt-4' : ''}`}>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-50 to-purple-100">
                <Calendar className="h-5 w-5 text-[#9b87f5]" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#A98CFF] to-[#6E59A5] bg-clip-text text-transparent">My Availability</h1>
            </div>
            <p className="text-gray-600 text-sm ml-10 mt-2">
              Set your working hours for each day
            </p>
          </div>
          <ProfileDropdown />
        </div>
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <div className={`flex items-center justify-between ${isNative ? 'pt-4' : ''}`}>
            <img 
              src="/museio-gradient-logo.svg" 
              alt="Museio Logo" 
              className="h-12"
            />            
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

      case 'jobs':
        return (
          <div className={`space-y-4 ${isNative ? 'pt-4' : ''}`}>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-50 to-purple-100">
                <Menu className="h-5 w-5 text-[#9b87f5]" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#A98CFF] to-[#6E59A5] bg-clip-text text-transparent">Jobs</h1>
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
                <Search className="h-4 w-4" />
              </div>
              <Input
                placeholder="Search jobs..."
                className="pl-10 rounded-2xl bg-white/90 border-gray-200/50 shadow-sm hover:bg-white focus:bg-white transition-colors duration-200" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: "2.5rem" }}
              />
            </div>
          </div>
        );
      case 'portfolio':
        return (
          <div className={`flex items-center justify-between ${isNative ? 'pt-4' : ''}`}>
            <img 
              src="/museio-gradient-logo.svg" 
              alt="Museio Logo" 
              className="h-12"
            />            
            <PortfolioHeaderControls />
          </div>
        );
      case 'finance':
        return (
          <div className={`flex items-center gap-2 ${isNative ? 'pt-4' : ''}`}>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-50 to-purple-100">
              <Wallet className="h-5 w-5 text-[#9b87f5]" />
            </div>
            <h1 className="bg-gradient-to-r from-[#A98CFF] to-[#6E59A5] bg-clip-text text-transparent text-2xl font-bold">
              Finance Overview
            </h1>
          </div>
        );

      case 'more':
        return (
          <div className={`flex items-center gap-2 ${isNative ? 'pt-4' : ''}`}>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-50 to-purple-100">
              <MoreHorizontal className="h-5 w-5 text-[#9b87f5]" />
            </div>
            <h1 className="bg-gradient-to-r from-[#A98CFF] to-[#6E59A5] bg-clip-text text-transparent text-2xl font-bold">
              More Options
            </h1>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    isNative ? (
    <header className="fixed-header bg-slate-50/95 py-4 backdrop-blur">
      <div className={headerShellClassName}>
        {renderContent()}
      </div>
    </header>
    ) : (
      <div className="app-header-frame py-4">
        <div className={headerShellClassName}>
          {renderContent()}
        </div>
      </div>
    )
  );
};

export default AppHeader;
