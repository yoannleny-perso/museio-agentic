
export type { JobStatus } from '@/contracts';

import type { JobStatus } from '@/contracts';

export type TabType = 'home' | 'jobs' | 'finance' | 'more' | 'portfolio';

export interface JobItem {
  id?: string;
  job_id?: string;
  item_name: string;
  unit_cost: number;
  quantity: number;
  is_taxable: boolean;
  sort_order: number;
}

export interface Job {
  id: string;
  title: string;
  location: string;
  date: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD for multi-day jobs
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  rate: number;
  status: JobStatus;
  client: string; // Keep for backward compatibility
  client_id?: string; // New client reference
  client_data?: Client; // Client data from JOIN query
  contact_name?: string; // Keep for backward compatibility
  notes?: string;
  contact_email?: string; // Keep for backward compatibility
  contact_phone?: string; // Keep for backward compatibility
  job_number?: string;
  job_description?: string;
  job_items?: JobItem[]; // New itemized pricing
  pricing_mode?: 'simple' | 'itemized'; // Optional for backward compatibility
  discount_percent?: number; // Global discount for itemized mode
}

export interface Client {
  id: string;
  user_id: string;
  venue_name: string;
  contact_name?: string;
  email_address?: string;
  location?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface BankDetails {
  accountHolderName: string;
  bsbNumber: string;
  accountNumber: string;
  fundName?: string;
  memberNumber?: string;
  fundAbn?: string;
  fundUsi?: string;
  includeSuperInInvoices?: boolean;
}

export interface InvoiceSettings {
  format: string;
  paymentTerms: number;
  footerNotes: string;
  logo?: string;
  signature?: string;
  addGST: boolean;
}

export interface ProfileData {
  firstName: string;
  lastName: string;
  nickname?: string;
  username: string;
  email: string;
  phone: string;
  industry: string;
  companyName?: string;
  companyAddress?: string;
  abn?: string;
}

export interface SmartLink {
  id: string;
  user_id: string;
  title: string;
  url: string;
  description?: string;
  icon_url?: string;
  thumbnail_url?: string;
  badge_text?: string;
  badge_color?: string;
  is_featured: boolean;
  is_visible: boolean;
  display_order: number;
  click_count: number;
  custom_styling?: any; // Changed from Record<string, any> to any to match Supabase Json type
  created_at: string;
  updated_at: string;
}
