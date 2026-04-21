
import React, { createContext, useContext, useState, useEffect, ReactNode ,useMemo} from 'react';
import { Job } from '@/types';
import { useAppContext } from './AppContext';
import { useToast } from '@/hooks/use-toast';
import { useInvoiceSender } from '@/hooks/useInvoiceSender';
import { useSupabaseProfileDetails } from '@/hooks/useSupabaseProfileDetails';
import { useProfile } from './ProfileContext';
import { useInvoiceSettings } from '@/hooks/useInvoiceSettings';
import { useJobOperations } from '@/hooks/useJobOperations';
import { useBankDetails } from './BankDetailsContext';
import { useSetupValidation } from '@/hooks/useSetupValidation';
import SetupValidationPopup from '@/components/setup/SetupValidationPopup';
import { set } from 'date-fns';
import { useBookingRequests } from '@/hooks/useBookingRequests';
import { BookingRequest } from '@/lib/bookingRequests';
import { JOB_STATUS, normalizeJobTab, type JobTab } from '@/contracts';

interface JobsContextType {
  // Job selection and modal states
  selectedJob: Job | null;
  setSelectedJob: (job: Job | null) => void;
  isDetailsOpen: boolean;
  setIsDetailsOpen: (open: boolean) => void;
  isInvoiceModalOpen: boolean;
  setIsInvoiceModalOpen: (open: boolean) => void;
  isQuoteModalOpen: boolean;
  setIsQuoteModalOpen: (open: boolean) => void;
  isPastJobModalOpen: boolean;
  setIsPastJobModalOpen: (open: boolean) => void;
  isPreviewOpen: boolean;
  setIsPreviewOpen: (open: boolean) => void;
  
  // Job operations
  handleJobClick: (job: Job) => void;
  handleEditJob: (id: string, data: Partial<Job>) => Promise<boolean>;
  handleDeleteJob: (id: string) => Promise<boolean>;
  handleSendInvoice: () => Promise<boolean>;
  handleMarkAsPaid: (job: Job) => Promise<boolean>;
  handleEditFromInvoice: (job: Job) => void;
  handleDetailsOpenChange: (open: boolean) => void;
  
  // Processing states
  isSending: boolean;
  isMarkingAsPaid: boolean;
  processingJobId: string | null;
  
  // Filters and tabs
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: JobTab;
  setActiveTab: (tab: JobTab) => void;
  
  // Job collections
  requestedJobs: Job[];
  draftedJobs: Job[];
  upcomingJobs: Job[];
  pastJobs: Job[];
  invoiceSentJobs: Job[];
  paidJobs: Job[];
  filteredJobs: Job[];

  // Booking requests
  bookingRequests: BookingRequest[];
  onSendQuote: (request: BookingRequest) => void;
  onDeclineRequest: (requestId: string) => void;
  onRemoveRequest: (requestId: string) => void;
}

const JobsContext = createContext<JobsContextType | undefined>(undefined);

export const JobsProvider: React.FC<{ children: React.ReactNode; initialTab?: string }> = ({ children, initialTab }) => {
  const { jobs } = useAppContext();
  
  // Get required data for invoice operations
  const { profileData } = useProfile();
  const { bankDetails } = useBankDetails();
  const { invoiceSettings } = useInvoiceSettings();
  const { sendInvoice, isSending: invoiceSending } = useInvoiceSender();
  
  // Job operations and modal states
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isPastJobModalOpen, setIsPastJobModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isMarkingAsPaid, setIsMarkingAsPaid] = useState(false);
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);

  // Use the job operations hook
  const {
    handleEditJob,
    handleDeleteJob,
    handleJobSubmit
  } = useJobOperations();

  const {
    bookingRequests,
    sendQuote,
    declineRequest,
    removeRequest
  } = useBookingRequests();

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<JobTab>(normalizeJobTab(initialTab));

  // Job click handler
  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setIsDetailsOpen(true);
  };

  // Handle details modal open/close
  const handleDetailsOpenChange = (open: boolean) => {
    setIsDetailsOpen(open);
    if (!open) {
      setSelectedJob(null);
    }
  };

  // Handle send invoice
  const handleSendInvoice = async (): Promise<boolean> => {
    if (!selectedJob) return false;
    
    setProcessingJobId(selectedJob.id);
    
    try {
      const success = await sendInvoice(
        selectedJob, 
        profileData, 
        bankDetails, 
        invoiceSettings?.logo
      );
      
      // Update job status to 'invoice-sent' if invoice was sent successfully
      if (success) {
        await handleEditJob(selectedJob.id, { status: JOB_STATUS.invoiceSent });
      }
      
      return success;
    } finally {
      setProcessingJobId(null);
    }
  };

  // Handle mark as paid
  const handleMarkAsPaid = async (job: Job): Promise<boolean> => {
    setIsMarkingAsPaid(true);
    setProcessingJobId(job.id);
    
    try {
      const success = await handleEditJob(job.id, { status: JOB_STATUS.paid });
      return success;
    } finally {
      setIsMarkingAsPaid(false);
      setProcessingJobId(null);
    }
  };

  // Handle edit from invoice
  const handleEditFromInvoice = (job: Job) => {
    setSelectedJob(job);
    setIsInvoiceModalOpen(false);
    setIsDetailsOpen(true);
  };

  // Filter jobs based on search query
  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return jobs;
  
    const searchLower = searchQuery.toLowerCase();
    return jobs.filter(job => 
      job.title.toLowerCase().includes(searchLower) ||
      job.client.toLowerCase().includes(searchLower) ||
      job.location.toLowerCase().includes(searchLower)
    );
  }, [jobs, searchQuery]);

  // Categorize jobs based on status
  const requestedJobs = useMemo(() => 
    filteredJobs.filter(job => job.status === JOB_STATUS.requested), [filteredJobs]
  );
  const draftedJobs = useMemo(() => 
    filteredJobs.filter(job => job.status === JOB_STATUS.drafted), [filteredJobs]
  );
  const upcomingJobs = useMemo(() => 
    filteredJobs.filter(job => job.status === JOB_STATUS.upcoming), [filteredJobs]
  );
  const pastJobs = useMemo(() => 
    filteredJobs.filter(job => job.status === JOB_STATUS.past), [filteredJobs]
  );
  const invoiceSentJobs = useMemo(() => 
    filteredJobs.filter(job => job.status === JOB_STATUS.invoiceSent), [filteredJobs]
  );
  const paidJobs = useMemo(() => 
    filteredJobs.filter(job => job.status === JOB_STATUS.paid), [filteredJobs]
  );
    
  // Booking request handlers
  const handleSendQuote = async (request: BookingRequest) => {
    const success = await sendQuote(request);
    // The useBookingRequests hook will handle updating the request status automatically
  };

  const handleDeclineRequest = async (requestId: string) => {
    await declineRequest(requestId);
  };

  const handleRemoveRequest = async (requestId: string) => {
    await removeRequest(requestId);
  };
  
  return (
    <JobsContext.Provider
      value={{
        selectedJob,
        setSelectedJob,
        isDetailsOpen,
        setIsDetailsOpen: handleDetailsOpenChange,
        isInvoiceModalOpen,
        setIsInvoiceModalOpen,
        isQuoteModalOpen,
        setIsQuoteModalOpen,
        isPastJobModalOpen,
        setIsPastJobModalOpen,
        isPreviewOpen,
        setIsPreviewOpen,
        handleJobClick,
        handleEditJob,
        handleDeleteJob,
        handleSendInvoice,
        handleMarkAsPaid,
        handleEditFromInvoice,
        handleDetailsOpenChange,
        isSending: invoiceSending,
        isMarkingAsPaid,
        processingJobId,
        searchQuery,
        setSearchQuery,
        activeTab,
        setActiveTab,
        requestedJobs,
        draftedJobs,
        upcomingJobs,
        pastJobs,
        invoiceSentJobs,
        paidJobs,
        filteredJobs,

        // Booking requests
        bookingRequests,
        onSendQuote: handleSendQuote,
        onDeclineRequest: handleDeclineRequest,
        onRemoveRequest: handleRemoveRequest
      }}
    >
      {children}
    </JobsContext.Provider>
  );
};

export const useJobsContext = () => {
  const context = useContext(JobsContext);
  if (context === undefined) {
    throw new Error('useJobsContext must be used within a JobsProvider');
  }
  return context;
};
