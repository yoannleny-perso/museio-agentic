import React from 'react';
import { Control, useFieldArray, UseFormWatch, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import JobItemRow from './JobItemRow';
import JobItemsSummary from './JobItemsSummary';
import { JobItem } from '@/types';
import { useInvoiceSettings } from '@/hooks/useInvoiceSettings';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface JobItemsManagerProps {
  control: Control<any>;
  watch: UseFormWatch<any>;
  errors?: any;
  disabled?: boolean;
  variant?: 'default' | 'prototype';
  showHeader?: boolean;
}

const JobItemsManager: React.FC<JobItemsManagerProps> = ({
  control,
  watch,
  errors,
  disabled = false,
  variant = 'default',
  showHeader = true,
}) => {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'job_items'
  });

  const watchedItems = watch('job_items') || [];
  const { invoiceSettings } = useInvoiceSettings();

  const sensors = useSensors(useSensor(PointerSensor));

  // Automatically add an empty item when fields is empty
  React.useEffect(() => {
    if (fields.length === 0 && invoiceSettings) {
      const newItem: Omit<JobItem, 'id' | 'job_id'> = {
        item_name: '',
        unit_cost: 0,
        quantity: 1,
        is_taxable: invoiceSettings?.addGST ?? false,
        sort_order: 0,
      };
      append(newItem);
    }
  }, [fields.length, append, invoiceSettings]);

  const addItem = () => {
    if (fields.length >= 10) return;

    const newItem: Omit<JobItem, 'id' | 'job_id'> = {
      item_name: '',
      unit_cost: 0,
      quantity: 1,
      is_taxable: invoiceSettings?.addGST ?? false,
      sort_order: fields.length,
    };

    append(newItem);
  };

  const removeItem = (index: number) => {
    remove(index);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((item) => item.id === active.id);
      const newIndex = fields.findIndex((item) => item.id === over.id);
      move(oldIndex, newIndex);
    }
  };

  return (
    <div className={variant === 'prototype' ? 'space-y-5' : 'space-y-4'}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className={variant === 'prototype' ? 'text-xl font-bold text-[#1F2430]' : 'text-lg font-semibold text-museio-purple'}>
            Line Items
          </h3>
          <span className={variant === 'prototype' ? 'text-sm text-[#7A7F8C]' : 'text-sm text-muted-foreground'}>
            {fields.length}/10 items
          </span>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {fields.map((field, index) => (
              <SortableRow
                key={field.id}
                id={field.id}
                index={index}
                control={control}
                onRemove={removeItem}
                errors={errors}
                variant={variant}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {fields.length < 10 && (
        <Button
          type="button"
          variant="outline"
          onClick={addItem}
          disabled={disabled}
          className={cn(
            "w-full border-dashed border-2",
            variant === 'prototype'
              ? 'rounded-xl border-[#DDDCE7] py-6 text-[#7A42E8] hover:border-[#7A42E8] hover:bg-[#F4EEFD]'
              : 'hover:bg-muted/50'
          )}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Line Item
        </Button>
      )}

      {fields.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No line items added yet.</p>
          <p className="text-sm">Click "Add Line Item" to get started.</p>
        </div>
      )}

      {fields.length > 0 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="discount_percent">Discount (%)</Label>
            <Controller
              name="discount_percent"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="discount_percent"
                  // Use text + inputMode to allow true blank/partial input while keeping numeric keyboard
                  type="text"
                  inputMode="decimal"
                  placeholder="Enter discount % (optional)"
                  value={field.value ?? ''}                 // allow blank UI
                  onChange={(e) => field.onChange(e.target.value)} // let schema preprocess/validate
                  className={variant === 'prototype' ? 'mt-2 h-12 rounded-xl border-2 border-[#DDDCE7] bg-white px-4 text-sm focus-visible:border-[#7A42E8] focus-visible:ring-0' : undefined}
                />
              )}
            />
            {errors?.discount_percent && (
              <p className="text-sm text-red-500 mt-1">{errors.discount_percent.message}</p>
            )}
          </div>

          <JobItemsSummary
            items={watchedItems}
            discountPercent={Number(watch('discount_percent') ?? 0) || 0}
            variant={variant}
          />
        </div>
      )}
    </div>
  );
};

export default JobItemsManager;

interface SortableRowProps {
  id: string;
  index: number;
  control: Control<any>;
  onRemove: (index: number) => void;
  errors?: any;
  variant: 'default' | 'prototype';
}

const SortableRow: React.FC<SortableRowProps> = ({ id, index, control, onRemove, errors, variant }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <JobItemRow
        index={index}
        control={control}
        onRemove={onRemove}
        errors={errors}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
        variant={variant}
      />
    </div>
  );
};
