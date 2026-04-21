import React, { useState, useEffect } from 'react';
import { Controller, Control } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, GripVertical, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JobItemRowProps {
  index: number;
  control: Control<any>;
  onRemove: (index: number) => void;
  errors?: any;
  isDragging?: boolean;
  dragHandleProps?: any;
  variant?: 'default' | 'prototype';
}

const JobItemRow: React.FC<JobItemRowProps> = ({
  index,
  control,
  onRemove,
  errors,
  isDragging = false,
  dragHandleProps,
  variant = 'default',
}) => {
  const [isExpanded, setIsExpanded] = useState(index === 0); // expand first item by default
  
  // Ensure first item is always expanded, even after re-renders/resets
  useEffect(() => {
    if (index === 0 && !isExpanded) {
      setIsExpanded(true);
    }
  }, [index, isExpanded]);
  const itemErrors = errors?.job_items?.[index];

  return (
    <div
      className={cn(
        'flex flex-col transition-all',
        variant === 'prototype'
          ? 'overflow-hidden rounded-[24px] border border-[#DDDCE7] bg-white'
          : 'px-1 border rounded-lg bg-card',
        isDragging && 'shadow-lg opacity-50'
      )}
    >
      {/* Header Row */}
      <div className={cn(
        'flex justify-between items-center',
        variant === 'prototype' ? 'gap-3 p-4' : ''
      )}>
        <div className="flex items-center gap-2">
          <div {...dragHandleProps} className="cursor-grab">
            <GripVertical className={cn(
              variant === 'prototype' ? 'h-5 w-5 text-[#A4A9B6]' : 'text-muted-foreground'
            )} />
          </div>
          <span className={cn(
            'text-sm',
            variant === 'prototype' ? 'font-medium text-[#1F2430]' : 'text-muted-foreground'
          )}>
            Item {index + 1}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className={cn(
              variant === 'prototype'
                ? 'rounded-lg text-[#7A7F8C] hover:bg-[#F8F9FB]'
                : 'text-muted-foreground'
            )}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                isExpanded ? 'rotate-0' : '-rotate-90'
              }`}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => onRemove(index)}
            className={cn(
              variant === 'prototype'
                ? 'rounded-lg text-red-600 hover:bg-red-50 hover:text-red-600'
                : ''
            )}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Collapsible Fields */}
      {isExpanded && (
        <div className={cn(
          'flex flex-col gap-4',
          variant === 'prototype' ? 'border-t border-[#DDDCE7] p-4' : 'mt-4'
        )}>
          <div>
            <Label htmlFor={`job_items.${index}.item_name`}>Item</Label>
            <Controller
              name={`job_items.${index}.item_name`}
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id={`job_items.${index}.item_name`}
                  placeholder="e.g. DJ Set"
                  className={variant === 'prototype' ? 'mt-2 h-11 rounded-xl border-2 border-[#DDDCE7] bg-white px-4 text-sm focus-visible:border-[#7A42E8] focus-visible:ring-0' : undefined}
                />
              )}
            />
            {itemErrors?.item_name && (
              <p className="text-sm text-red-500 mt-1">{itemErrors.item_name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`job_items.${index}.unit_cost`}>($) Unit Cost</Label>
              <Controller
                name={`job_items.${index}.unit_cost`}
                control={control}
                render={({ field }) => (
                <Input
                  {...field}
                  id={`job_items.${index}.unit_cost`}
                  type="number"
                  min={0}
                  step="0.01"
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === '' ? '' : parseFloat(val));
                  }}
                  className={variant === 'prototype' ? 'mt-2 h-11 rounded-xl border-2 border-[#DDDCE7] bg-white px-4 text-sm focus-visible:border-[#7A42E8] focus-visible:ring-0' : undefined}
                />
              )}
            />
              {itemErrors?.unit_cost && (
                <p className="text-sm text-red-500 mt-1">{itemErrors.unit_cost.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor={`job_items.${index}.quantity`}>Quantity</Label>
              <Controller
                name={`job_items.${index}.quantity`}
                control={control}
                render={({ field }) => (
                <Input
                  {...field}
                  id={`job_items.${index}.quantity`}
                  type="number"
                  min={1}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === '' ? '' : parseFloat(val));
                  }}
                  className={variant === 'prototype' ? 'mt-2 h-11 rounded-xl border-2 border-[#DDDCE7] bg-white px-4 text-sm focus-visible:border-[#7A42E8] focus-visible:ring-0' : undefined}
                />
              )}
            />
              {itemErrors?.quantity && (
                <p className="text-sm text-red-500 mt-1">{itemErrors.quantity.message}</p>
              )}
            </div>
          </div>


          <div className="flex items-center gap-2 pt-1">
            <Controller
              name={`job_items.${index}.is_taxable`}
              control={control}
              render={({ field }) => (
                <Checkbox
                  id={`job_items.${index}.is_taxable`}
                  checked={!!field.value}
                  onCheckedChange={(checked) => field.onChange(!!checked)}
                />
              )}
            />
            <Label htmlFor={`job_items.${index}.is_taxable`} className="text-sm">
              Apply tax to this item
            </Label>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobItemRow;
