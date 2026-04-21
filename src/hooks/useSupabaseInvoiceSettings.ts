
import { useInvoiceSettings } from './useInvoiceSettings';

// This file exists for backward compatibility
// It re-exports the new hook with the old name to avoid breaking existing code
export const useSupabaseInvoiceSettings = useInvoiceSettings;
