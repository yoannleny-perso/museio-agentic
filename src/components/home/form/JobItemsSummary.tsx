import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { JobItem } from '@/types';
import { calculateJobItemsSummary } from '@/services/jobItemsService';
import { cn } from '@/lib/utils';

interface JobItemsSummaryProps {
  items: JobItem[];
  showTax?: boolean;
  gstRate?: number;
  discountPercent?: number;
  variant?: 'default' | 'prototype';
}

const JobItemsSummary: React.FC<JobItemsSummaryProps> = ({
  items,
  showTax = true,
  gstRate = 0.1,
  discountPercent = 0,
  variant = 'default',
}) => {
  const { subtotal, tax, total, discountAmount } = calculateJobItemsSummary(items, gstRate, discountPercent);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Card className={cn(
      variant === 'prototype' && 'rounded-[24px] border border-[#DDDCE7] shadow-none'
    )}>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className={cn('text-sm font-medium', variant === 'prototype' && 'text-[#4F5868]')}>
              Subtotal:
            </span>
            <span className={cn('text-sm', variant === 'prototype' && 'text-[#1F2430]')}>
              ${subtotal.toFixed(2)}
            </span>
          </div>
          
          {discountPercent > 0 && (
            <div className="flex justify-between items-center">
              <span className={cn('text-sm font-medium', variant === 'prototype' && 'text-[#4F5868]')}>
                Discount ({discountPercent.toFixed(0)}%):
              </span>
              <span className={cn('text-sm', variant === 'prototype' && 'text-[#1F2430]')}>
                -${discountAmount.toFixed(2)}
              </span>
            </div>
          )}
          
          {showTax && tax > 0 && (
            <div className="flex justify-between items-center">
              <span className={cn('text-sm font-medium', variant === 'prototype' && 'text-[#4F5868]')}>
                GST ({(gstRate * 100).toFixed(0)}%):
              </span>
              <span className={cn('text-sm', variant === 'prototype' && 'text-[#1F2430]')}>
                ${tax.toFixed(2)}
              </span>
            </div>
          )}
          
          <div className={cn('border-t pt-2', variant === 'prototype' && 'border-[#DDDCE7] pt-3')}>
            <div className="flex justify-between items-center">
              <span className={cn('font-semibold', variant === 'prototype' && 'text-[#1F2430]')}>
                Total:
              </span>
              <span className={cn('font-semibold text-lg', variant === 'prototype' && 'text-[#1F2430]')}>
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobItemsSummary;
