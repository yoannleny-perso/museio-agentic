
import React, { useEffect, useState } from 'react';
import { useModedPortfolioPhoto } from '@/hooks/useModedPortfolioPhoto';
import { useArtistName } from '@/hooks/useArtistName';
import { useSocialMediaLinks } from '@/hooks/useSocialMediaLinks';
import { useLiveSocialMediaLinks } from '@/hooks/useLiveSocialMediaLinks';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';
import { usePortfolioMode } from '@/context/PortfolioModeContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import SocialMediaIcons from '@/components/portfolio2/SocialMediaIcons';
import PortfolioPhotoSection from '@/components/portfolio2/PortfolioPhotoSection';
import ArtistNameDisplay from '@/components/portfolio2/ArtistNameDisplay';
import ShortBioDisplay from './ShortBioDisplay';
import ExpandableBio from './ExpandableBio';
import TabNavigationBar from './TabNavigationBar';
import BioReadMoreButton from './BioReadMoreButton';

interface HeroHeaderProps {
  onSectionClick: (section: string) => void;
  isEditMode?: boolean;
}

const HeroHeader: React.FC<HeroHeaderProps> = ({ onSectionClick, isEditMode = false }) => {
  const { headerPhoto, fetchHeaderPhoto, uploadPhoto, deletePhoto, uploading, loading: photoLoading } = useModedPortfolioPhoto();
  const { artistName, loading: artistLoading, saveArtistName } = useArtistName();
  const { mode, userHandle } = usePortfolioMode();
  
  // Use different hooks based on mode
  const editModeData = useSocialMediaLinks();
  const liveModeData = useLiveSocialMediaLinks({ username: userHandle || undefined });
  
  // Select appropriate data based on mode
  const isLiveMode = mode === 'live';
  const { socialLinks, loading: socialLoading, updateSocialLink, saveSocialLinks, reorderSocialLinks } = isLiveMode 
    ? liveModeData 
    : editModeData;
    
  const { selectedGradient } = usePortfolioTheme();
  const [showFullBio, setShowFullBio] = useState(false);
  const [isEditingFullBio, setIsEditingFullBio] = useState(false);

  const isDarkGradient = ['dark-purple', 'dark-blue', 'dark-navy', 'dark-emerald', 'dark-rose'].includes(selectedGradient);
  const heroTitleColor = isDarkGradient ? '#F8FAFC' : '#0F172A';
  const heroBodyColor = isDarkGradient ? 'rgba(248,250,252,0.9)' : 'rgba(15,23,42,0.72)';
  const heroTextShadow = isDarkGradient
    ? '0 3px 20px rgba(15,23,42,0.52)'
    : '0 3px 18px rgba(255,255,255,0.78)';

  useEffect(() => {
    fetchHeaderPhoto();
  }, [fetchHeaderPhoto]);

  // Reset editing state when full bio is closed
  useEffect(() => {
    if (!showFullBio) {
      setIsEditingFullBio(false);
    }
  }, [showFullBio]);

  const handleToggleBio = () => {
    setShowFullBio(!showFullBio);
  };

  return (
    <TooltipProvider>
      <div className="pb-0 text-center relative">
        {headerPhoto ? (
          <div className="-mx-4 -mt-6 mb-4 md:mx-0 md:mt-0">
            <div className="relative">
              <PortfolioPhotoSection
                isEditMode={isEditMode}
                heroMode
                headerPhotoOverride={headerPhoto}
                uploadingOverride={uploading}
                loadingOverride={photoLoading}
                uploadPhotoOverride={uploadPhoto}
                deletePhotoOverride={deletePhoto}
                fetchHeaderPhotoOverride={fetchHeaderPhoto}
              />
              <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-10 md:px-8 md:pb-10">
                <div className="mx-auto max-w-[32rem] text-center">
                  <ArtistNameDisplay 
                    artistName={artistName} 
                    loading={artistLoading} 
                    onSave={saveArtistName}
                    isEditMode={isEditMode}
                    variant="hero"
                    textColorOverride={heroTitleColor}
                    textShadow={heroTextShadow}
                  />
                  <ShortBioDisplay
                    onToggleBio={handleToggleBio}
                    showFullBio={showFullBio}
                    isEditMode={isEditMode}
                    isEditingFullBio={isEditingFullBio}
                    variant="hero"
                    textColorOverride={heroBodyColor}
                    textShadow={heroTextShadow}
                  />
                </div>
              </div>
            </div>
            <div className="px-4 pt-3 md:px-0">
              <BioReadMoreButton
                onToggleBio={handleToggleBio}
                showFullBio={showFullBio}
                isEditingFullBio={isEditingFullBio}
              />
              {showFullBio && (
                <div className="mt-1 mb-3 px-1" style={{ backgroundColor: 'transparent' }}>
                  <ExpandableBio 
                    isEditMode={isEditMode} 
                    onEditingChange={setIsEditingFullBio}
                    onCloseBio={() => setShowFullBio(false)}
                  />
                </div>
              )}
              <div className="mt-2 mb-4">
                <SocialMediaIcons 
                  socialLinks={socialLinks} 
                  loading={socialLoading}
                  onUpdateLink={updateSocialLink}
                  onSaveLinks={saveSocialLinks}
                  onReorderLinks={reorderSocialLinks}
                  isEditMode={isEditMode}
                  compactEmptyState
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 px-4 pt-2 md:px-0 md:pt-0">
              <PortfolioPhotoSection
                isEditMode={isEditMode}
                headerPhotoOverride={headerPhoto}
                uploadingOverride={uploading}
                loadingOverride={photoLoading}
                uploadPhotoOverride={uploadPhoto}
                deletePhotoOverride={deletePhoto}
                fetchHeaderPhotoOverride={fetchHeaderPhoto}
              />
            </div>

            <ArtistNameDisplay 
              artistName={artistName} 
              loading={artistLoading} 
              onSave={saveArtistName}
              isEditMode={isEditMode}
            />

            <ShortBioDisplay
              onToggleBio={handleToggleBio}
              showFullBio={showFullBio}
              isEditMode={isEditMode}
              isEditingFullBio={isEditingFullBio}
            />

            <BioReadMoreButton
              onToggleBio={handleToggleBio}
              showFullBio={showFullBio}
              isEditingFullBio={isEditingFullBio}
            />

            {showFullBio && (
              <div className="mt-1 mb-3 px-4" style={{ backgroundColor: 'transparent' }}>
                <ExpandableBio 
                  isEditMode={isEditMode} 
                  onEditingChange={setIsEditingFullBio}
                  onCloseBio={() => setShowFullBio(false)}
                />
              </div>
            )}

            <div className="mt-2 mb-4">
              <SocialMediaIcons 
                socialLinks={socialLinks} 
                loading={socialLoading}
                onUpdateLink={updateSocialLink}
                onSaveLinks={saveSocialLinks}
                onReorderLinks={reorderSocialLinks}
                isEditMode={isEditMode}
              />
            </div>
          </>
        )}

        {/* Tab Navigation - now positioned inside hero header */}
        <TabNavigationBar onSectionClick={onSectionClick} />
      </div>
    </TooltipProvider>
  );
};

export default HeroHeader;
