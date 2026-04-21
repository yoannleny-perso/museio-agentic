
import { toast } from 'sonner';
import { useModedPortfolioData } from '@/context/PortfolioDataContextModed';

export const useBio = () => {
  const { data, loading, saving: contextSaving, updateData } = useModedPortfolioData();

  const bioShort = data?.bio_short || '';
  const bioFull = data?.bio_full || '';

  const saveBio = async (short: string, full: string) => {
    const success = await updateData({
      bio_short: short,
      bio_full: full
    });

    if (success) {
      toast.success('Bio updated successfully');
    }
  };

  return {
    bioShort,
    bioFull,
    loading,
    saving: contextSaving,
    saveBio
  };
};
