
import React from 'react';
import { Users, Settings, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface MoreDrawerProps {
  isOpen: boolean;
  onClose: (itemSelected?: boolean) => void;
}

const MoreDrawer: React.FC<MoreDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const menuItems = [
    {
      icon: Users,
      label: 'Clients',
      description: 'Manage your client list',
      path: '/app/clients'
    },
    {
      icon: Calendar,
      label: 'My Availability',
      description: 'Set your working hours',
      path: '/app/availability'
    },
    {
      icon: Settings,
      label: 'Settings',
      description: 'Account and app settings',
      path: '/app/settings'
    }
  ];

  const handleItemClick = (path: string) => {
    // Close the drawer and navigate immediately
    onClose(true);
    navigate(path);
  };

  const handleDrawerClose = () => {
    onClose(false);
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleDrawerClose}>
      <DrawerContent className="max-w-md mx-auto">
        <DrawerHeader>
          <DrawerTitle className="text-left">More Options</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleItemClick(item.path)}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-purple-50 to-purple-100">
                <item.icon className="h-5 w-5 text-[#9b87f5]" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{item.label}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MoreDrawer;
