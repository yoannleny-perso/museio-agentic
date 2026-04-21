
import React from 'react';
import { format } from 'date-fns';
import { formatTimeWithoutSeconds, formatCurrency } from '@/lib/utils';
import { Job, JobItem } from '@/types';
import { useJobItems } from '@/hooks/useJobItems';

interface InvoiceItemsSectionProps {
  job?: Job | null;
  subtotal: number;
  compact?: boolean;
}

const InvoiceItemsSection: React.FC<InvoiceItemsSectionProps> = ({ job, subtotal, compact = false }) => {
  const today = new Date();
  const { data: jobItems = [] } = useJobItems(job?.id);
  
  // Check if job uses itemized pricing
  const isItemized = job?.pricing_mode === 'itemized' && jobItems.length > 0;
  
  return (
    <div className={`${compact ? "mb-3 mt-2" : "mb-8 mt-3"}`}>
      {/* Job Info Section */}
      <div className={`${compact ? "mb-2" : "mb-4"}`}>
        <p className={`${compact ? "text-[10px]" : "text-sm text-gray-600"} line-clamp-1 mt-1`}>{job?.title || 'DJ Performance at The Venue'}</p>
        {job?.job_number && (
          <p className={`${compact ? "text-[10px]" : "text-sm"} mt-1`}>Job Number: {job.job_number}</p>
        )}
        {job?.job_description && (
          <p className={`${compact ? "text-[10px] line-clamp-1" : "text-sm"} mt-1`}>{job?.job_description}</p>
        )}
        <p className={`${compact ? "text-[10px]" : "text-sm text-gray-600"} mt-1`}>
          Date: {job ? format(new Date(job.date), compact ? 'dd/MM/yyyy' : 'MMMM d, yyyy') : format(today, compact ? 'dd/MM/yyyy' : 'MMMM d, yyyy')}
        </p>
  
      </div>

      {/* Items Table */}
      <div className="border rounded-md">
        {isItemized ? (
          /* Itemized 4-column layout */
          <>
            <div className="bg-gray-100 grid grid-cols-[1fr_auto_auto_auto] gap-x-1 p-2 font-bold rounded-t-md">
              <div className={compact ? "text-xs" : ""}>Description</div>
              <div className={`text-center px-2 ${compact ? "text-xs" : ""}`}>Rate</div>
              <div className={`text-center px-2 ${compact ? "text-xs" : ""}`}>Qty</div>
              <div className={`text-right px-2 min-w-[80px] ${compact ? "text-xs" : ""}`}>Amount</div>
            </div>
            
            <div className={`border-t ${compact ? "divide-y-0" : "divide-y"}`}>
              {jobItems.map((item: JobItem, index: number) => {
                const itemAmount = item.unit_cost * item.quantity;
                return (
                  <div key={item.id || index} className={`grid grid-cols-[1fr_auto_auto_auto] gap-x-1 ${compact ? "p-1" : "p-2"}`}>
                    <div className={`${compact ? "text-[10px]" : "text-sm"}`}>{item.item_name}</div>
                    <div className={`text-center px-2 ${compact ? "text-[10px]" : "text-sm"}`}>{formatCurrency(item.unit_cost)}</div>
                    <div className={`text-center px-2 ${compact ? "text-[10px]" : "text-sm"}`}>{item.quantity}</div>
                    <div className={`text-right font-medium px-2 min-w-[80px] ${compact ? "text-[10px]" : "text-sm"}`}>{formatCurrency(itemAmount)}</div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Simple 2-column layout */
          <>
            <div className="bg-gray-100 grid grid-cols-2 p-2 font-bold rounded-t-md">
              <div className={compact ? "text-xs" : ""}>Description</div>
              <div className={`text-right ${compact ? "text-xs" : ""}`}>Amount</div>
            </div>
            
            <div className={`border-t ${compact ? "p-2" : "p-4"}`}>
              <div className="grid grid-cols-2">
                <div className={`${compact ? "text-[10px]" : "text-sm"}`}>Service Fee</div>
                <div className={`text-right font-medium bg-gradient-to-r from-[#8B5CF6] to-[#6E59A5] bg-clip-text text-transparent ${compact ? "text-[10px]" : "text-sm"}`}>
                  {formatCurrency(subtotal)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InvoiceItemsSection;
