import { supabase } from '@/integrations/supabase/client';
import { JobItem } from '@/types';

/**
 * Fetch job items for a specific job
 */
export const fetchJobItems = async (jobId: string): Promise<JobItem[]> => {
  const { data, error } = await supabase
    .from('job_items')
    .select('*')
    .eq('job_id', jobId)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[jobItemsService] Error fetching job items:', error);
    throw error;
  }

  return data || [];
};

/**
 * Create job items in batch for a job
 */
export const createJobItems = async (jobId: string, items: Omit<JobItem, 'id' | 'job_id'>[]): Promise<JobItem[]> => {
  console.log('[jobItemsService] createJobItems called with:', { jobId, items });
  
  if (!items.length) {
    console.log('[jobItemsService] No items to create, returning empty array');
    return [];
  }

  const itemsWithJobId = items.map((item, index) => ({
    ...item,
    job_id: jobId,
    sort_order: index
  }));
  
  console.log('[jobItemsService] Items with job_id and sort_order:', itemsWithJobId);

  const { data, error } = await supabase
    .from('job_items')
    .insert(itemsWithJobId)
    .select();

  if (error) {
    console.error('[jobItemsService] Error creating job items:', error);
    throw error;
  }

  return data || [];
};

/**
 * Update job items for a job (replaces all existing items)
 */
export const updateJobItems = async (jobId: string, items: Omit<JobItem, 'job_id'>[]): Promise<JobItem[]> => {
  // Start a transaction-like operation
  try {
    // First, delete existing items
    await deleteJobItems(jobId);

    // Then create new items
    if (items.length > 0) {
      const itemsToCreate = items.map((item, index) => ({
        item_name: item.item_name,
        unit_cost: item.unit_cost,
        quantity: item.quantity,
        is_taxable: item.is_taxable,
        sort_order: index
      }));

      return await createJobItems(jobId, itemsToCreate);
    }

    return [];
  } catch (error) {
    console.error('[jobItemsService] Error updating job items:', error);
    throw error;
  }
};

/**
 * Delete all job items for a job
 */
export const deleteJobItems = async (jobId: string): Promise<void> => {
  const { error } = await supabase
    .from('job_items')
    .delete()
    .eq('job_id', jobId);

  if (error) {
    console.error('[jobItemsService] Error deleting job items:', error);
    throw error;
  }
};

/**
 * Calculate total from job items with global discount
 */
export const calculateJobItemsTotal = (items: JobItem[], discountPercent: number = 0): number => {
  const subtotal = items.reduce((total, item) => {
    const itemTotal = item.unit_cost * item.quantity;
    return total + itemTotal;
  }, 0);
  
  const discountAmount = subtotal * (discountPercent / 100);
  return subtotal - discountAmount;
};

/**
 * Calculate subtotal, tax, and total from job items with global discount
 */
export const calculateJobItemsSummary = (items: JobItem[], gstRate: number = 0.1, discountPercent: number = 0) => {
  const subtotal = items.reduce((total, item) => {
    const itemTotal = item.unit_cost * item.quantity;
    return total + itemTotal;
  }, 0);

  const discountAmount = subtotal * (discountPercent / 100);
  const discountedSubtotal = subtotal - discountAmount;

  const taxableAmount = items
    .filter(item => item.is_taxable)
    .reduce((total, item) => {
      const itemTotal = item.unit_cost * item.quantity;
      return total + itemTotal;
    }, 0);

  const discountedTaxableAmount = taxableAmount - (taxableAmount * (discountPercent / 100));
  const tax = discountedTaxableAmount * gstRate;
  const total = discountedSubtotal + tax;

  return {
    subtotal,
    discountAmount,
    tax,
    total,
    taxableAmount
  };
};