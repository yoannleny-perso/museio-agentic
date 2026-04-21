
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const DEFAULT_LOGO_URL = '/images/default-logo.png';

/**
 * Format time string (HH:MM:SS) to (HH:MM AM/PM) format
 */
export function formatTimeWithoutSeconds(timeString: string): string {
  if (!timeString) return '';
  
  try {
    // Parse the time string (assumed to be in 24-hour format like "13:30:00")
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);
    
    // Convert to 12-hour format
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
    
    // Format the time
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  } catch (e) {
    console.error('Error formatting time:', e);
    return timeString;
  }
}

/**
 * Format a number as currency (AUD)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2
  }).format(value);
}

/**
 * Truncate text to specified length and add ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Generate time options in 30-minute increments for time selection dropdowns
 * Returns times in 24-hour format (HH:MM) including next-day times up to 30:00 (6 AM next day)
 */
export function generateTimeOptions(interval: number = 15, includeNextDay: boolean = true): string[] {
  const options: string[] = [];
  const maxHours = includeNextDay ? 30 : 24;
  const minutes = maxHours * 60; // Total minutes
  
  for (let i = 0; i < minutes; i += interval) {
    const hour = Math.floor(i / 60);
    const minute = i % 60;
    
    // Format as HH:MM (24+ hour for next day)
    options.push(
      `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    );
  }
  
  return options;
}

/**
 * Format time for display, showing "(next day)" for times >= 24:00
 */
export function formatTimeDisplay(timeString: string): string {
  if (!timeString) return '';
  
  const [hours, minutes] = timeString.split(':').map(Number);
  
  if (hours >= 24) {
    const displayHour = hours - 24;
    return `${displayHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} (next day)`;
  }
  
  return timeString;
}
