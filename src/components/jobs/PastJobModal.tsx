
import React from 'react';
import { Job } from '@/types';
import PastJobModalContainer from '@/components/jobs/past-job-modal/PastJobModalContainer';
import InvoicePreviewDialog from '@/components/settings/InvoicePreviewDialog';
import { useInvoiceSettings } from '@/hooks/useInvoiceSettings';
import { useSignature } from '@/context/SignatureContext';
import { useProfile } from '@/context/ProfileContext';
import { useBankDetails } from '@/context/BankDetailsContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const profileFormSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  username: z.string().optional(),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phone: z.string().optional(),
  industry: z.string().optional(),
  companyName: z.string().optional(),
  companyAddress: z.string().optional(),
  abn: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface PastJobModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  onEdit: (id: string, job: Partial<Job>) => Promise<boolean>;
  onSendInvoice: () => Promise<boolean>;
  onMarkAsPaid?: (job: Job) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
  isPreviewOpen: boolean;
  setIsPreviewOpen: (open: boolean) => void;
  isSending?: boolean;
  isMarkingAsPaid?: boolean;
  onDuplicateJob?: (job: Job) => void;
}

const PastJobModal: React.FC<PastJobModalProps> = ({
  isOpen,
  onOpenChange,
  job,
  onEdit,
  onSendInvoice,
  onMarkAsPaid,
  onDelete,
  isPreviewOpen,
  setIsPreviewOpen,
  isSending = false,
  isMarkingAsPaid = false,
  onDuplicateJob
}) => {
  const { invoiceSettings } = useInvoiceSettings();
  const { profileData, loading: loadingProfile } = useProfile();
  const { bankDetails } = useBankDetails();
  const { signature, loading: loadingSignature } = useSignature();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      phone: '',
      industry: '',
      companyName: '',
      companyAddress: '',
      abn: '',
    },
  });

  // Populate form when profile data is loaded
  React.useEffect(() => {
    if (profileData) {
      form.reset({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        username: profileData.username || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        industry: profileData.industry || '',
        companyName: profileData.companyName || '',
        companyAddress: profileData.companyAddress || '',
        abn: profileData.abn || '',
      });
    }
  }, [form, profileData]);
  
  if (!job) return null;
  
  return (
    <>
      <PastJobModalContainer
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        job={job}
        onEdit={onEdit}
        onSendInvoice={onSendInvoice}
        onMarkAsPaid={onMarkAsPaid}
        onDelete={onDelete}
        isPreviewOpen={isPreviewOpen}
        setIsPreviewOpen={setIsPreviewOpen}
        isSending={isSending}
        isMarkingAsPaid={isMarkingAsPaid}
        onDuplicateJob={onDuplicateJob}
      />
      
      {/* Use the consistent InvoicePreviewDialog with all required props */}
      {invoiceSettings && job && (
        <InvoicePreviewDialog
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          invoiceSettings={invoiceSettings}
          profileData={form.getValues()}
          bankDetails={bankDetails}
          job={job}
          signature={signature?.displayUrl || signature?.signature}
          signatureType={signature?.signature_type}
        />
      )}
    </>
  );
};

export default PastJobModal;
