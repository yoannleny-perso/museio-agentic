
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, subDays, parseISO, isAfter, endOfDay, addDays } from 'date-fns';
import { useInvoiceSettings } from '@/hooks/useInvoiceSettings';
import { DEFAULT_INVOICE_SETTINGS } from '@/types/invoiceSettings';

export type DateRangeOption = 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'year_to_date' | 'all_time';

export interface InvoiceChartData {
  paid: number;
  pending: number;
  overdue: number;
  total: number;
}

// Define the structure of an invoice record from the database
interface SentInvoice {
  id: string;
  invoice_number: string;
  amount: number;
  job_id: string;
  client_email: string;
  status: string;
  sent_at: string;
  user_id: string;
  updated_at: string;
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

export const useInvoiceData = (dateRangeOption: DateRangeOption) => {
  const { getDateRange } = useDateRange(dateRangeOption);
  const { startDate, endDate } = getDateRange(dateRangeOption);
  const { invoiceSettings } = useInvoiceSettings();
  
  const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');
  
  const fetchInvoiceData = async (): Promise<InvoiceChartData> => {
    // Get payment terms from invoice settings or use default (14 days)
    const paymentTerms = invoiceSettings?.paymentTerms || DEFAULT_INVOICE_SETTINGS.paymentTerms;
    
    // Use an explicit type cast to handle the table typings
    const { data: invoices, error } = await supabase
      .from('sent_invoices')
      .select('*')
      .gte('sent_at', formatDate(startDate))
      .lte('sent_at', formatDate(endDate)) as { data: SentInvoice[] | null, error: any };
    
    if (error) {
      console.error('Error fetching invoice data:', error);
      throw error;
    }
    
    // Calculate due date based on payment terms from settings
    const now = new Date();
    
    let paid = 0;
    let pending = 0;
    let overdue = 0;
    
    invoices?.forEach(invoice => {
      const amount = Number(invoice.amount) || 0;
      
      if (invoice.status === 'paid' || invoice.status === 'invoice_paid') {
        paid += amount;
      } else {
        // Calculate if overdue based on payment terms from settings
        const sentDate = parseISO(invoice.sent_at);
        const dueDate = addDays(sentDate, paymentTerms);
        
        if (isAfter(now, dueDate)) {
          overdue += amount;
        } else {
          pending += amount;
        }
      }
    });
    
    const total = paid + pending + overdue;
    
    return { paid, pending, overdue, total };
  };
  
  return useQuery({
    queryKey: ['invoiceData', dateRangeOption, formatDate(startDate), formatDate(endDate), invoiceSettings?.paymentTerms],
    queryFn: fetchInvoiceData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
