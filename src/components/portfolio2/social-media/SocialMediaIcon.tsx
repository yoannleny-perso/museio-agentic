
import React from 'react';
import { Edit } from 'lucide-react';
import { SocialMediaLink } from '@/hooks/useSocialMediaLinks';
import { getSocialIcon } from './socialIconMap';

interface SocialMediaIconProps {
  link: SocialMediaLink;
  onEdit: (platform: string, currentUrl: string) => void;
}

const SocialMediaIcon: React.FC<SocialMediaIconProps> = ({ link, onEdit }) => {
  return (
    <div className="relative group">
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-11 h-11 text-gray-600 hover:text-[#8B5CF6] transition-colors duration-200 hover:scale-110 transform"
        style={{ minWidth: '44px', minHeight: '44px' }}
      >
        {getSocialIcon(link.platform)}
      </a>
      <button
        onClick={() => onEdit(link.platform, link.url)}
        className="absolute -top-1 -right-1 w-5 h-5 bg-[#8B5CF6] text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
      >
        <Edit className="h-3 w-3" />
      </button>
    </div>
  );
};

export default SocialMediaIcon;
