
import { useToast } from '@/hooks/use-toast';
import { Job } from '@/types';
import { format } from 'date-fns';

export const useClipboardOperations = () => {
  const { toast } = useToast();

  const handleCopyToClipboard = (job: Job) => {
    const formatDate = (dateStr: string) => {
      try {
        return format(new Date(dateStr), 'PPP');
      } catch (error) {
        console.error("Error formatting date:", error);
        return 'Invalid Date';
      }
    };
    
    const formatTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      return format(date, 'h:mm a');
    };
    
    const jobDetails = `
      Title: ${job.title}
      Client: ${job.client}
      Date: ${formatDate(job.date)}
      Time: ${formatTime(job.start_time)} - ${formatTime(job.end_time)}
      Location: ${job.location}
      Rate: $${job.rate}
      Notes: ${job.notes || 'N/A'}
    `;
    
    navigator.clipboard.writeText(jobDetails).then(() => {
      toast({
        title: 'Job Details Copied',
        description: 'Job details have been copied to the clipboard.'
      });
    }).catch(err => {
      console.error("Failed to copy job details: ", err);
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy job details to clipboard.',
        variant: 'destructive'
      });
    });
  };

  return {
    handleCopyToClipboard
  };
};
