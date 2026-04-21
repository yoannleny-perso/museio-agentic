
import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import TabBar from './TabBar';
import AppHeader from './AppHeader';
import MoreDrawer from './MoreDrawer';
import { useAppContext } from '@/context/AppContext';
import { useJobsContext } from '@/context/JobsContext';
import { TabType } from '@/types';
import { Capacitor } from '@capacitor/core';
import { PortfolioDataProvider } from '@/context/PortfolioDataContext';
import { buildJobsRoute } from '@/contracts';
import { cn } from '@/lib/utils';

interface LayoutProps {
  onAddJob?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ onAddJob }) => {
  const { activeTab, setActiveTab } = useAppContext();
  const { activeTab: jobsActiveTab } = useJobsContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);
  const mainContentRef = useRef<HTMLElement>(null);
  const isFormRoute = location.pathname.includes('/jobs/new') || location.pathname.includes('/edit-job');
  const isHomeRoute = location.pathname === '/app/home' || location.pathname === '/app';
  const isPortfolioRoute = location.pathname === '/app/portfolio';
  const showAppHeader = !isFormRoute && !isHomeRoute;
  const isNative = Capacitor.isNativePlatform();

  // Determine the active tab based on current path
  const currentTab = useMemo<TabType>(() => {
    const path = location.pathname.replace('/app/', '');
    
    if (path === '' || path === 'home') return 'home';
    if (path === 'jobs') return 'jobs';
    if (path === 'portfolio') return 'portfolio';
    if (path === 'finance') return 'finance';
    // Both clients and settings should show 'more' as the active tab
    if (['clients', 'settings', 'availability', 'more'].includes(path)) return 'more';
    return 'home';
  }, [location.pathname]);
  
  // Sync activeTab with current route (one-way sync)
  useEffect(() => {
    if (activeTab !== currentTab) {
      setActiveTab(currentTab);
    }
  }, [currentTab, activeTab, setActiveTab]);

  // Reset scroll position when switching between main pages via TabBar
  useEffect(() => {
    const isMainTabRoute = ['home', 'jobs', 'finance', 'portfolio'].includes(currentTab);
    
    // Only reset scroll for main tab routes, not form routes or drawer navigation
    if (isMainTabRoute && !isFormRoute && mainContentRef.current) {
      setTimeout(() => {
        if (mainContentRef.current) {
          // Temporarily disable smooth scrolling for instant jump
          const originalScrollBehavior = mainContentRef.current.style.scrollBehavior;
          mainContentRef.current.style.scrollBehavior = 'auto';
          mainContentRef.current.scrollTop = 0;
          // Restore smooth scrolling after reset
          setTimeout(() => {
            if (mainContentRef.current) {
              mainContentRef.current.style.scrollBehavior = originalScrollBehavior;
            }
          }, 10);
        }
      }, 50);
    }
  }, [location.pathname, currentTab, isFormRoute]);
  
  // Handle direct tab navigation (only for main tabs, not sub-routes)
  const handleTabNavigation = (tab: TabType) => {
    if (tab === 'more') {
      // Don't navigate directly to /app/more, just open the drawer
      setIsMoreDrawerOpen(true);
      return;
    }
    
    setActiveTab(tab);
    const path = tab === 'home'
      ? '/app/home'
      : tab === 'jobs'
        ? buildJobsRoute(jobsActiveTab)
        : `/app/${tab}`;
    navigate(path);
  };

  const handleAddClient = () => {
    setIsAddClientDialogOpen(true);
  };

  const handleMoreClick = () => {
    setIsMoreDrawerOpen(true);
  };

  const handleMoreDrawerClose = (itemSelected: boolean = false) => {
    setIsMoreDrawerOpen(false);
  };

  const layoutContent = (
    <div className={isNative ? 'mobile-container' : 'web-container'}>
      {showAppHeader && <AppHeader onAddJob={onAddJob} onAddClient={handleAddClient} />}
      <main
        id={isFormRoute ? undefined : 'main-scroll-container'}
        ref={mainContentRef}
        className={cn(
          isFormRoute
            ? 'form-route-content'
            : isPortfolioRoute
              ? 'portfolio-route-content'
              : 'mobile-content'
        )}
      >
        <Outlet context={{ isAddClientDialogOpen, setIsAddClientDialogOpen }} />
      </main>
      {!isFormRoute && (
        <>
          <TabBar onMoreClick={handleMoreClick} onTabClick={handleTabNavigation} />
          {isNative && (
            <div className="safe-area-bottom"/>
          )}
        </>
      )}
      
      {/* More Drawer */}
      <MoreDrawer 
        isOpen={isMoreDrawerOpen} 
        onClose={handleMoreDrawerClose}
      />
    </div>
  );

  if (currentTab === 'portfolio') {
    return <PortfolioDataProvider>{layoutContent}</PortfolioDataProvider>;
  }

  return layoutContent;
};

export default Layout;
