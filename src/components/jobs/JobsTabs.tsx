import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Job } from '@/types';
import JobsList from './JobsList';
import BookingRequestsList from './BookingRequestsList';
import { BookingRequest } from '@/lib/bookingRequests';
import { BOOKING_REQUEST_STATUS, JOB_TAB, buildJobsRoute, normalizeJobTab, type JobTab } from '@/contracts';
import { 
  MessageSquare, 
  Calendar, 
  Receipt, 
  CheckCircle, 
  FileEdit 
} from 'lucide-react';

interface JobsTabsProps {
  draftedJobs: Job[];
  upcomingJobs: Job[];
  pastJobs: Job[];
  invoiceSentJobs: Job[];
  paidJobs: Job[];
  bookingRequests: BookingRequest[];
  onJobClick: (job: Job) => void;
  onMarkAsPaid: (e: React.MouseEvent, job: Job) => void;
  activeTab: JobTab;
  setActiveTab: (tab: JobTab) => void;
  onInvoiceClick?: (job: Job) => void;
  onSendQuote: (request: BookingRequest) => void;
  onDeclineRequest: (requestId: string) => void;
  onRemoveRequest: (requestId: string) => void;
}

const JobsTabs: React.FC<JobsTabsProps> = ({
  draftedJobs,
  upcomingJobs,
  pastJobs,
  invoiceSentJobs,
  paidJobs,
  bookingRequests,
  onJobClick,
  onMarkAsPaid,
  activeTab,
  setActiveTab,
  onInvoiceClick,
  onSendQuote,
  onDeclineRequest,
  onRemoveRequest
}) => {
  const navigate = useNavigate();
  const pendingRequestsCount = bookingRequests.filter(
    (req) => req.status === BOOKING_REQUEST_STATUS.pending
  ).length;
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        const nextTab = normalizeJobTab(value);
        setActiveTab(nextTab);
        navigate(buildJobsRoute(nextTab), { replace: true });
      }}
      className="w-full"
    >
      <TabsList className="flex justify-between w-full mb-6 bg-transparent h-auto p-0">
        
        <TabsTrigger 
          value={JOB_TAB.requests}
          className="flex flex-col items-center gap-1 py-2 px-2 text-xs font-medium border-none bg-transparent data-[state=active]:bg-gray-50/80 data-[state=active]:shadow-lg data-[state=active]:text-museio-purple data-[state=active]:scale-105 rounded-lg flex-1 transition-all duration-200 hover:bg-gray-50 hover:shadow-md"
        >
          <div className="relative">
            <MessageSquare className="w-4 h-4" />
            {pendingRequestsCount > 0 && (
              <div className="absolute -top-2 -right-2 bg-museio-purple text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center min-w-[16px] shadow-sm">
                {pendingRequestsCount}
              </div>
            )}
          </div>
          <span>Requests</span>
        </TabsTrigger>
        
        <TabsTrigger 
          value={JOB_TAB.upcoming}
          className="flex flex-col items-center gap-1 py-2 px-2 text-xs font-medium border-none bg-transparent data-[state=active]:bg-gray-50/80 data-[state=active]:shadow-lg data-[state=active]:text-museio-purple data-[state=active]:scale-105 rounded-lg flex-1 transition-all duration-200 hover:bg-gray-50 hover:shadow-md"
        >
          <Calendar className="w-4 h-4" />
          <span>Upcoming</span>
        </TabsTrigger>
        
        <TabsTrigger 
          value={JOB_TAB.invoiceSent}
          className="flex flex-col items-center gap-1 py-2 px-2 text-xs font-medium border-none bg-transparent data-[state=active]:bg-gray-50/80 data-[state=active]:shadow-lg data-[state=active]:text-museio-purple data-[state=active]:scale-105 rounded-lg flex-1 transition-all duration-200 hover:bg-gray-50 hover:shadow-md"
        >
          <Receipt className="w-4 h-4" />
          <span>Invoiced</span>
        </TabsTrigger>
        
        <TabsTrigger 
          value={JOB_TAB.paid}
          className="flex flex-col items-center gap-1 py-2 px-2 text-xs font-medium border-none bg-transparent data-[state=active]:bg-gray-50/80 data-[state=active]:shadow-lg data-[state=active]:text-museio-purple data-[state=active]:scale-105 rounded-lg flex-1 transition-all duration-200 hover:bg-gray-50 hover:shadow-md"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Paid</span>
        </TabsTrigger>
        
        <TabsTrigger 
          value={JOB_TAB.drafted}
          className="flex flex-col items-center gap-1 py-2 px-2 text-xs font-medium border-none bg-transparent data-[state=active]:bg-gray-50/80 data-[state=active]:shadow-lg data-[state=active]:text-museio-purple data-[state=active]:scale-105 rounded-lg flex-1 transition-all duration-200 hover:bg-gray-50 hover:shadow-md"
        >
          <FileEdit className="w-4 h-4" />
          <span>Drafts</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value={JOB_TAB.requests}>
        <BookingRequestsList 
          requests={bookingRequests.filter(
            (req) => req.status !== BOOKING_REQUEST_STATUS.accepted
          )}
          onAccept={onSendQuote}
          onDecline={onDeclineRequest}
          onRemove={onRemoveRequest}
        />
      </TabsContent>

      <TabsContent value={JOB_TAB.upcoming}>
        <JobsList 
          jobs={upcomingJobs} 
          onJobClick={onJobClick}
          isCompletedTab={false}
          onInvoiceClick={onInvoiceClick}
        />
      </TabsContent>
      
      <TabsContent value={JOB_TAB.invoiceSent}>
        <JobsList 
          jobs={invoiceSentJobs} 
          onJobClick={onJobClick}
          onMarkAsPaid={onMarkAsPaid}
          isCompletedTab={true}
          onInvoiceClick={onInvoiceClick}
        />
      </TabsContent>
      
      <TabsContent value={JOB_TAB.paid}>
        <JobsList 
          jobs={paidJobs} 
          onJobClick={onJobClick}
          isCompletedTab={true}
          onInvoiceClick={onInvoiceClick}
        />
      </TabsContent>
      
      <TabsContent value={JOB_TAB.drafted}>
        <JobsList 
          jobs={draftedJobs} 
          onJobClick={onJobClick}
          isCompletedTab={false}
          onInvoiceClick={onInvoiceClick}
        />
      </TabsContent>
      
      <TabsContent value={JOB_TAB.past}>
        <JobsList 
          jobs={pastJobs} 
          onJobClick={onJobClick}
          isCompletedTab={true}
          onInvoiceClick={onInvoiceClick}
        />
      </TabsContent>
    </Tabs>
  );
};

export default JobsTabs;
