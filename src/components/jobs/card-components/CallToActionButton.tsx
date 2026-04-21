
import React from 'react';
import { DollarSign, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Job } from '@/types';

interface CallToActionButtonProps {
  job: Job;
  onMarkAsPaid?: (e: React.MouseEvent, job?: Job) => void;
  isSending?: boolean;
}

const CallToActionButton: React.FC<CallToActionButtonProps> = ({
  job,
  onMarkAsPaid,
  isSending = false
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (job.status === 'invoice-sent' && onMarkAsPaid) {
      onMarkAsPaid(e, job);
    }
  };
  
  // Don't show any buttons for drafted, upcoming, past or paid jobs
  if (job.status === 'paid' || job.status === 'drafted' || job.status === 'upcoming' || job.status === 'past') {
    return null;
  }
  
  const buttonProps = {
    variant: 'default' as 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link',
    size: 'sm' as const,
    onClick: handleClick,
    className: "mt-1 w-full",
    icon: <DollarSign size={14} className="mr-1" />,
    text: "Action",
    disabled: isSending,
    customBgColor: ""
  };
  
  // Only show "Mark as Paid" button for invoice-sent jobs
  if (job.status === 'invoice-sent') {
    buttonProps.text = isSending ? "Processing..." : "Mark as Paid";
    buttonProps.icon = isSending ? <Loader2 size={14} className="mr-1 animate-spin" /> : <DollarSign size={14} className="mr-1" />;
    buttonProps.customBgColor = "bg-[#F2FCE2] hover:bg-[#D1F2BB] text-[#4B7F52]";
  }
  
  return (
    <Button 
      variant="default"
      size={buttonProps.size}
      onClick={buttonProps.onClick}
      className={`${buttonProps.className} ${buttonProps.customBgColor}`}
      disabled={buttonProps.disabled}
    >
      {buttonProps.icon} {buttonProps.text}
    </Button>
  );
};

export default CallToActionButton;
