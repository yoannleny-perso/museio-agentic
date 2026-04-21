
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface InvoicePreviewButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const InvoicePreviewButton: React.FC<InvoicePreviewButtonProps> = ({ onClick, disabled = false }) => {
  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full mt-2"
      onClick={onClick}
      disabled={disabled}
    >
      <FileText className="mr-2 h-4 w-4" />
      Preview Invoice
    </Button>
  );
};

export default InvoicePreviewButton;
