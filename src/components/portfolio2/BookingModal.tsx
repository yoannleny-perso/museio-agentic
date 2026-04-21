
import React from 'react';
import PortfolioDialog from './PortfolioDialog';
import BookingPage from '@/pages/BookingPage';
import { usePortfolioTheme } from '@/hooks/usePortfolioTheme';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  artistUsername: string;
}


const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  artistUsername
}) => {
  const { themeColors } = usePortfolioTheme();

  return (
    <PortfolioDialog
      open={isOpen}
      onOpenChange={onClose}
      hideCloseButton
      className="max-h-[92vh] w-full max-w-[min(72rem,92vw)] overflow-y-auto border-0 bg-transparent p-0 shadow-none rounded-none gap-0"
    >
      <div className="p-0">
        <BookingPage
          variant="modal"
          username={artistUsername}
          onClose={onClose}
          themeColors={themeColors}
        />
      </div>
    </PortfolioDialog>
  );
};

export default BookingModal;
