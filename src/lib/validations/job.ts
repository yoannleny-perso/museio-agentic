
import { z } from 'zod';

// Job item schema
const jobItemSchema = z.object({
  item_name: z.string().min(1, { message: 'Item name is required' }),
  unit_cost: z.number().min(0, { message: 'Unit cost must be positive' }),
  quantity: z.number().min(0.01, { message: 'Quantity must be greater than 0' }),
  is_taxable: z.boolean(),
  sort_order: z.number().default(0)
});

export const jobFormSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  job_number: z.string().optional(),
  job_description: z.string().max(500, { message: 'Description cannot exceed 500 characters' }).optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  client: z.string().min(1, { message: '' }),
  contact_name: z.string().optional(),
  date: z.string().min(1, { message: 'Start date is required' }),
  end_date: z.string().min(1, { message: 'End date is required' }),
  start_time: z.string().min(1, { message: 'Start time is required' }),
  end_time: z.string().min(1, { message: 'End time is required' }),
  // Rate is conditional based on pricing mode
  rate: z.string().optional(),
  notes: z.string().optional(),
  contact_email: z
    .string()
    .min(1, { message: 'At least one email address is required' })
    .refine(
      (val) => {
        const emails = val.split(',').map(e => e.trim()).filter(e => e.length > 0);
        return emails.length > 0 && emails.every(email => z.string().email().safeParse(email).success);
      },
      { message: 'One or more email addresses are invalid' }
    ),
  contact_phone: z.string().optional(),
  // New job items array
  job_items: z.array(jobItemSchema).max(10, { message: 'Maximum 10 items allowed' }).optional(),
  // Pricing mode selection
  pricing_mode: z.enum(['simple', 'itemized']).default('simple'),
  // Global discount for itemized mode
  discount_percent: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      // Handle empty string as undefined/optional
      if (val === '' || val === null || val === undefined) return undefined;
      // Convert string to number
      const num = typeof val === 'string' ? parseFloat(val) : val;
      // Return NaN for invalid strings, which will be caught by validation
      return isNaN(num) ? NaN : num;
    })
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0 && val <= 100), {
      message: 'Please enter a valid discount between 0 and 100, or leave empty for no discount'
    })
}).refine((data) => {
  // Parse dates to compare them
  const startDate = new Date(data.date);
  const endDate = new Date(data.end_date);
  
  // If dates are different, just check that end date is not before start date
  if (data.date !== data.end_date) {
    return endDate >= startDate;
  }
  
  // If dates are the same, compare times
  return data.end_time > data.start_time;
}, {
  message: "End date and time must be after start date and time",
  path: ["end_time"] // Show error on the end_time field
}).refine((data) => {
  // Ensure either rate or job_items are provided
  const hasRate = data.rate && data.rate.trim() !== '';
  const hasItems = data.job_items && data.job_items.length > 0;
  
  if (data.pricing_mode === 'itemized') {
    return hasItems;
  } else {
    return hasRate;
  }
}, {
  message: "Either a rate or line items must be provided",
  path: ["rate"]
});

export type JobFormData = z.infer<typeof jobFormSchema>;
