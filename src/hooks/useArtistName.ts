
import { toast } from 'sonner';
import { useModedPortfolioData } from '@/context/PortfolioDataContextModed';

export const useArtistName = () => {
  const { data, loading, saving: contextSaving, updateData } = useModedPortfolioData();

  const artistName = data?.artist_name || '';

  const saveArtistName = async (name: string) => {
    const success = await updateData({
      artist_name: name
    });

    if (success) {
      toast.success('Artist name updated successfully');
    }
  };

  return {
    artistName,
    loading,
    saving: contextSaving,
    saveArtistName
  };
};
