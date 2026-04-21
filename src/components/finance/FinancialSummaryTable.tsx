
import React, { useMemo } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Job } from '@/types';
import { getJobDisplayPrice } from '@/utils/jobPricing';
import { format, parseISO } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Calendar, ClockAlert, FileText, Receipt } from 'lucide-react';

interface FinancialSummaryTableProps {
  jobs: Job[];
  isLoading: boolean;
}

const FinancialSummaryTable: React.FC<FinancialSummaryTableProps> = ({ jobs, isLoading }) => {
  // Filter jobs by their status
  const upcomingjobs = useMemo(() => {
    return jobs.filter(job => job.status === 'upcoming')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [jobs]);
  
  const pastjobs = useMemo(() => {
    return jobs.filter(job => job.status === 'past')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [jobs]);
  
  const invoicedjobs = useMemo(() => {
    return jobs.filter(job => job.status === 'invoice-sent')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [jobs]);
  
  const paidjobs = useMemo(() => {
    return jobs.filter(job => job.status === 'paid')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [jobs]);
  
  // Calculate totals
  const upcomingTotal = useMemo(() => 
    upcomingjobs.reduce((sum, job) => sum + getJobDisplayPrice(job), 0), 
  [upcomingjobs]);
  
  const pastTotal = useMemo(() => 
    pastjobs.reduce((sum, job) => sum + getJobDisplayPrice(job), 0), 
  [pastjobs]);
  
  const invoicedTotal = useMemo(() => 
    invoicedjobs.reduce((sum, job) => sum + getJobDisplayPrice(job), 0), 
  [invoicedjobs]);
  
  const paidTotal = useMemo(() => 
    paidjobs.reduce((sum, job) => sum + getJobDisplayPrice(job), 0), 
  [paidjobs]);

  // Helper to format dates
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };
  
  // Empty state
  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-10">
      <p className="text-gray-500">{message}</p>
    </div>
  );
  
  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-10">
            <p>Loading financial data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-[20px] bg-white/90 backdrop-blur-sm shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.05)] border border-[rgba(122,83,255,0.08)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-[#4D2AAE] text-[22px] font-bold">Financial Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upcoming">
          <TabsList className="mb-4">
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Upcoming ({upcomingjobs.length})</span>
            </TabsTrigger>
            <TabsTrigger value="past" className="flex items-center gap-2">
              <ClockAlert className="h-4 w-4" />
              <span>Past ({pastjobs.length})</span>
            </TabsTrigger>
            <TabsTrigger value="invoiced" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Invoiced ({invoicedjobs.length})</span>
            </TabsTrigger>
            <TabsTrigger value="paid" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              <span>Paid ({paidjobs.length})</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingjobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <EmptyState message="No upcoming jobs" />
                      </TableCell>
                    </TableRow>
                  ) : (
                    upcomingjobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>{formatDate(job.date)}</TableCell>
                        <TableCell>{job.client}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{job.title}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(getJobDisplayPrice(job))}</TableCell>
                      </TableRow>
                    ))
                  )}
                  {upcomingjobs.length > 0 && (
                    <TableRow className="bg-gray-50">
                      <TableCell colSpan={3} className="font-bold">Total</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(upcomingTotal)}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="past">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastjobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <EmptyState message="No past jobs" />
                      </TableCell>
                    </TableRow>
                  ) : (
                    pastjobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>{formatDate(job.date)}</TableCell>
                        <TableCell>{job.client}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{job.title}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(getJobDisplayPrice(job))}</TableCell>
                      </TableRow>
                    ))
                  )}
                  {pastjobs.length > 0 && (
                    <TableRow className="bg-gray-50">
                      <TableCell colSpan={3} className="font-bold">Total</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(pastTotal)}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="invoiced">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoicedjobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <EmptyState message="No invoiced jobs" />
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoicedjobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>{formatDate(job.date)}</TableCell>
                        <TableCell>{job.client}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{job.title}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(getJobDisplayPrice(job))}</TableCell>
                      </TableRow>
                    ))
                  )}
                  {invoicedjobs.length > 0 && (
                    <TableRow className="bg-gray-50">
                      <TableCell colSpan={3} className="font-bold">Total</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(invoicedTotal)}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="paid">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paidjobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <EmptyState message="No paid jobs" />
                      </TableCell>
                    </TableRow>
                  ) : (
                    paidjobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>{formatDate(job.date)}</TableCell>
                        <TableCell>{job.client}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{job.title}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(getJobDisplayPrice(job))}</TableCell>
                      </TableRow>
                    ))
                  )}
                  {paidjobs.length > 0 && (
                    <TableRow className="bg-gray-50">
                      <TableCell colSpan={3} className="font-bold">Total</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(paidTotal)}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FinancialSummaryTable;
