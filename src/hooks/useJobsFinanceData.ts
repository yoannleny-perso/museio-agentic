
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, subDays, parseISO, isAfter, endOfDay, addDays } from 'date-fns';
import { useInvoiceSettings } from '@/hooks/useInvoiceSettings';
import { getJobDisplayPrice } from '@/utils/jobPricing';
import { DEFAULT_INVOICE_SETTINGS } from '@/types/invoiceSettings';

export type DateRangeOption = 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'year_to_date' | 'all_time';

export interface JobsFinanceData {
  paid: number;
  pending: number;
  overdue: number;
  total: number;
}

export const useDateRange = (initialRange: DateRangeOption = 'last_month') => {
  const [dateRange, setDateRange] = useState<DateRangeOption>(initialRange);
  
  const getDateRange = (option: DateRangeOption): { startDate: Date, endDate: Date } => {
    const now = new Date();
    const todayEndOfDay = endOfDay(now);
    
    switch (option) {
      case 'this_month':
        return {
          startDate: startOfMonth(now),
          endDate: todayEndOfDay
        };
      case 'last_month':
        return {
          startDate: subDays(now, 30),
          endDate: todayEndOfDay
        };
      case 'last_3_months':
        return {
          startDate: subDays(now, 90),
          endDate: todayEndOfDay
        };
      case 'last_6_months':
        return {
          startDate: subDays(now, 180),
          endDate: todayEndOfDay
        };
      case 'year_to_date':
        return {
          startDate: new Date(now.getFullYear(), 0, 1),
          endDate: todayEndOfDay
        };
      case 'all_time':
      default:
        return {
          startDate: new Date(2000, 0, 1), // Far in the past
          endDate: todayEndOfDay
        };
    }
  };

  return { dateRange, setDateRange, getDateRange };
};

export const useJobsFinanceData = (dateRangeOption: DateRangeOption) => {
  const { getDateRange } = useDateRange(dateRangeOption);
  const { startDate, endDate } = getDateRange(dateRangeOption);
  const { invoiceSettings } = useInvoiceSettings();
  
  const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');
  
  const fetchJobsFinanceData = async (): Promise<JobsFinanceData> => {
    // Get payment terms from invoice settings or use default (14 days)
    const paymentTerms = invoiceSettings?.paymentTerms || DEFAULT_INVOICE_SETTINGS.paymentTerms;
    
    // First, get all jobs in the date range
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .gte('date', formatDate(startDate))
      .lte('date', formatDate(endDate));
    
    if (error) {
      console.error('Error fetching job data:', error);
      throw error;
    }
    
    // Also get sent invoices for correlation
    const { data: sentInvoices, error: invoicesError } = await supabase
      .from('sent_invoices')
      .select('*');
      
    if (invoicesError) {
      console.error('Error fetching invoice data:', invoicesError);
      // Continue with just jobs data
    }
    
    const now = new Date();
    
    let paid = 0;
    let pending = 0;
    let overdue = 0;
    
    jobs?.forEach(job => {
      const amount = getJobDisplayPrice(job as any);
      
      if (job.status === 'paid') {
        paid += amount;
      } else if (job.status === 'invoice-sent') {
        // Try to find a corresponding invoice to get the sent_at date
        const jobInvoice = sentInvoices?.find(invoice => invoice.job_id === job.id);
        
        if (jobInvoice) {
          // Use the actual sent date from the invoice
          const sentDate = parseISO(jobInvoice.sent_at);
          const dueDate = addDays(sentDate, paymentTerms);
          
          if (isAfter(now, dueDate)) {
            overdue += amount;
          } else {
            pending += amount;
          }
        } else {
          // Fallback to using job date if invoice record not found
          const jobDate = parseISO(job.date);
          const dueDate = addDays(jobDate, paymentTerms);
          
          if (isAfter(now, dueDate)) {
            overdue += amount;
          } else {
            pending += amount;
          }
        }
      }
    });
    
    const total = paid + pending + overdue;
    
    return { paid, pending, overdue, total };
  };
  
  return useQuery({
    queryKey: ['jobsFinanceData', dateRangeOption, formatDate(startDate), formatDate(endDate), invoiceSettings?.paymentTerms],
    queryFn: fetchJobsFinanceData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
