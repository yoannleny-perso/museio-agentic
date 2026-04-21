
import { useMemo } from 'react';
import { useSupabaseJobs } from './useSupabaseJobs';
import { Client } from '@/types';
import { getJobDisplayPrice } from '@/utils/jobPricing';

interface ClientInvoiceStats {
  invoiceCount: number;
  totalEarned: number;
  totalForecast: number;
}

export const useClientInvoiceStats = () => {
  const { jobs } = useSupabaseJobs();

  const clientStats = useMemo(() => {
    const statsMap = new Map<string, ClientInvoiceStats>();

    // Calculate stats for each client
    jobs.forEach(job => {
      const clientName = job.client;
      const existing = statsMap.get(clientName) || { invoiceCount: 0, totalEarned: 0, totalForecast: 0 };
      
      // Update invoice count and total earned for invoice-sent or paid jobs
      if (job.status === 'invoice-sent' || job.status === 'paid') {
        existing.invoiceCount += 1;
        existing.totalEarned += getJobDisplayPrice(job);
      }
      
      // Update total forecast for upcoming jobs
      if (job.status === 'upcoming') {
        existing.totalForecast += getJobDisplayPrice(job);
      }
      
      statsMap.set(clientName, existing);
    });

    return statsMap;
  }, [jobs]);

  const getClientStats = (client: Client): ClientInvoiceStats => {
    return clientStats.get(client.venue_name) || { invoiceCount: 0, totalEarned: 0, totalForecast: 0 };
  };

  return { getClientStats };
};
