import React, { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DateRangeOption, useJobsFinanceData } from '@/hooks/useJobsFinanceData';
import { useAppContext } from '@/context/AppContext';
import { format, isAfter, parseISO, startOfMonth, subDays, addDays } from 'date-fns';
import { useInvoiceSettings } from '@/hooks/useInvoiceSettings';
import { getJobDisplayPrice } from '@/utils/jobPricing';
import { DEFAULT_INVOICE_SETTINGS } from '@/types/invoiceSettings';
import { Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Import refactored components
import DateRangeSelector from './components/invoice-status/DateRangeSelector';
import EmptyState from './components/invoice-status/EmptyState';
import EarningsChart from './components/invoice-status/EarningsChart';
import EarningsBreakdown from './components/invoice-status/EarningsBreakdown';
import { CHART_COLORS, formatCurrency, getDateRangeDisplay } from './components/invoice-status/utils';

interface JobsFinanceData {
  paid: number;
  pending: number;
  overdue: number;
  total: number;
}

const InvoiceStatusWidget: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRangeOption>('last_month');
  const { jobs, loading } = useAppContext();
  const { invoiceSettings, loading: loadingSettings } = useInvoiceSettings();
  
  // Get date range
  const getDateRange = (option: DateRangeOption): { startDate: Date, endDate: Date } => {
    const now = new Date();
    
    switch (option) {
      case 'this_month':
        return {
          startDate: startOfMonth(now),
          endDate: now
        };
      case 'last_month':
        return {
          startDate: subDays(now, 30),
          endDate: now
        };
      case 'last_3_months':
        return {
          startDate: subDays(now, 90),
          endDate: now
        };
      case 'last_6_months':
        return {
          startDate: subDays(now, 180),
          endDate: now
        };
      case 'year_to_date':
        return {
          startDate: new Date(now.getFullYear(), 0, 1),
          endDate: now
        };
      case 'all_time':
      default:
        return {
          startDate: new Date(2000, 0, 1), // Far in the past
          endDate: now
        };
    }
  };

  // Calculate finance data based on jobs
  const data = useMemo((): JobsFinanceData => {
    if (loading || jobs.length === 0) {
      return { paid: 0, pending: 0, overdue: 0, total: 0 };
    }
    
    // Get payment terms from invoice settings or use default (14 days)
    const paymentTerms = invoiceSettings?.paymentTerms || DEFAULT_INVOICE_SETTINGS.paymentTerms;
    
    const { startDate, endDate } = getDateRange(dateRange);
    const now = new Date();
    
    let paid = 0;
    let pending = 0;
    let overdue = 0;
    
    // Helper function to check if a job's invoice is overdue based on payment terms
    const isInvoiceOverdue = (job: any): boolean => {
      // Try to find the invoice for this job in the sent_invoices table
      // (This would be better with a proper database query, but we're working with what's available)
      
      // For now, we use the job date as a proxy for when the invoice was sent
      // In a real-world scenario, we would fetch the actual sent_at date from sent_invoices table
      const jobDate = parseISO(job.date);
      const dueDateAfterJob = addDays(jobDate, paymentTerms);
      
      return isAfter(now, dueDateAfterJob);
    };
    
    jobs.forEach(job => {
      const jobDate = parseISO(job.date);
      
      // Check if job is within the selected date range
      const isInRange = jobDate >= startDate && jobDate <= endDate;
      
      if (isInRange) {
        const amount = getJobDisplayPrice(job);
        
        if (job.status === 'paid') {
          // 1. Paid: status = 'paid'
          paid += amount;
        } else if (job.status === 'invoice-sent') {
          // Check if invoice is overdue based on payment terms
          if (isInvoiceOverdue(job)) {
            // 3. Overdue: status = 'invoice-sent' AND sent date + payment terms < today
            overdue += amount;
          } else {
            // 2. Pending: status = 'invoice-sent' AND sent date + payment terms >= today
            pending += amount;
          }
        }
        // Note: 'past' and other statuses are no longer considered for calculations
      }
    });
    
    const total = paid + pending + overdue;
    
    return { paid, pending, overdue, total };
  }, [jobs, dateRange, loading, invoiceSettings]);
  
  // Set up the chart data
  const chartData = data && data.total > 0 ? [
    { name: 'Paid', value: data.paid, fill: CHART_COLORS.paid },
    { name: 'Pending', value: data.pending, fill: CHART_COLORS.pending },
    { name: 'Overdue', value: data.overdue, fill: CHART_COLORS.overdue },
  ].filter(item => item.value > 0) : [];
  
  const handleDateRangeChange = (value: string) => {
    setDateRange(value as DateRangeOption);
  };

  const { startDate, endDate } = getDateRange(dateRange);
  const dateRangeDisplay = getDateRangeDisplay(dateRange, startDate, endDate);
  const hasData = chartData.length > 0 && !loading;
  
  // Get payment terms for display
  const paymentTerms = invoiceSettings?.paymentTerms || DEFAULT_INVOICE_SETTINGS.paymentTerms;

  return (
    <Card className="w-full overflow-hidden rounded-[20px] bg-white/90 backdrop-blur-sm shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.05)] border border-[rgba(122,83,255,0.08)]">
  <CardHeader className="flex flex-row items-start justify-between pb-4 px-6 pt-6">
    <div>
      <div className="flex items-center">
        <CardTitle className="text-[#4D2AAE] text-[18px] md:text-[22px] font-bold">
          Earnings
        </CardTitle>
        <Popover>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button className="ml-1 inline-flex items-center justify-center rounded-full w-5 h-5 text-[#9b87f5] bg-transparent">
                    <Info size={16} />
                    <span className="sr-only">Earnings calculation info</span>
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                Click for earnings info
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <PopoverContent className="w-64 p-4 text-sm" align="start">
            <div className="space-y-3">
              <h3 className="font-medium text-[#4D2AAE] pb-1 border-b border-gray-100">
                How earnings are calculated:
              </h3>
              <div className="space-y-2">
                <p>
                  <b>Paid:</b> Payment received.
                </p>
                <p>
                  <b>Pending:</b> Invoice sent 
                  <br />
                  <span className="text-xs">
                    (within <span className="text-[#4D2AAE] font-medium">{paymentTerms} days</span>)
                  </span>
                </p>
                <p>
                  <b>Overdue:</b> Invoice sent 
                  <br />
                  <span className="text-xs">
                    (over <span className="text-[#4D2AAE] font-medium">{paymentTerms} days</span> ago)
                  </span>
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-2 pt-1 border-t border-gray-100">
                Note: Payment terms (<span className="text-gray-500 font-medium">{paymentTerms} days</span>) can be adjusted in your invoice settings.
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <p className="text-[12px] text-[#888888] mt-1 leading-tight">
        From invoicing status
      </p>
      <p className="text-[11px] text-[#888888] mt-0.5">
        {dateRangeDisplay}
      </p>
    </div>
    <DateRangeSelector 
      dateRange={dateRange} 
      onDateRangeChange={handleDateRangeChange} 
    />
  </CardHeader>

  <CardContent className="px-4 sm:px-6 pb-6">
    {loading || loadingSettings ? (
      <div className="flex items-center justify-center py-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent text-[#8B5CF6] mr-2" />
        <span className="text-sm text-gray-600">Loading financial data...</span>
      </div>
    ) : !hasData ? (
      <EmptyState dateRange={dateRange} />
    ) : (
      <div className="flex flex-col gap-4 sm:gap-6">
        <EarningsChart 
          chartData={chartData} 
          total={data.total}
          formatCurrency={formatCurrency}
        />
        <div className="overflow-x-auto">
          <EarningsBreakdown
            entries={chartData}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>
    )}
  </CardContent>
</Card>

  );
};

export default InvoiceStatusWidget;
