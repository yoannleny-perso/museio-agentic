
import React from 'react';
import { cn } from '@/lib/utils';

interface CircularIconProps {
  children: React.ReactNode;
  className?: string;
}

const CircularIcon = ({ children, className }: CircularIconProps) => {
  return (
    <div 
      className={cn(
        "flex items-center justify-center rounded-full border-[1.5px] border-[#9b87f5] bg-transparent w-5 h-5",
        "hover:shadow-md hover:scale-110 transition-all duration-300 rotate-2",
        className
      )}
    >
      {children}
    </div>
  );
};

export default CircularIcon;
