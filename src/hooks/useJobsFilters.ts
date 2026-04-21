
import { useState, useMemo } from 'react';
import { Job } from '@/types';
import { isPast, parseISO } from 'date-fns';

/**
 * Custom hook to filter and search jobs by different criteria
 */
export const useJobsFilters = (jobs: Job[]) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('requested');
  
  // Filter jobs based on search query
  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    
    if (!searchQuery.trim()) return jobs;
    
    const query = searchQuery.toLowerCase().trim();
    return jobs.filter(job => 
      job.title.toLowerCase().includes(query) || 
      job.client.toLowerCase().includes(query) ||
      job.location.toLowerCase().includes(query) ||
      (job.job_number && job.job_number.toLowerCase().includes(query))
    );
  }, [jobs, searchQuery]);
  
  // Categorize jobs by status
  const categorizedJobs = useMemo(() => {
    const requested: Job[] = [];
    const drafted: Job[] = [];
    const upcoming: Job[] = [];
    const past: Job[] = [];
    const invoiceSent: Job[] = [];
    const paid: Job[] = [];
    
    filteredJobs.forEach(job => {
      switch(job.status) {
        case 'requested':
          requested.push(job);
          break;
        case 'drafted':
          drafted.push(job);
          break;
        case 'upcoming':
          upcoming.push(job);
          break;
        case 'past':
          past.push(job);
          break;
        case 'invoice-sent':
          invoiceSent.push(job);
          break;
        case 'paid':
          paid.push(job);
          break;
      }
    });
    
    // Note: We still maintain past jobs internally even though they're not shown in the UI
    
    return { requested, drafted, upcoming, past, invoiceSent, paid };
  }, [filteredJobs]);
  
  return {
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    requestedJobs: categorizedJobs.requested,
    draftedJobs: categorizedJobs.drafted,
    upcomingJobs: categorizedJobs.upcoming,
    pastJobs: categorizedJobs.past, // Still return past jobs for internal use
    invoiceSentJobs: categorizedJobs.invoiceSent,
    paidJobs: categorizedJobs.paid
  };
};
