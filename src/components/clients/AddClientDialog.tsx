
import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PrimaryActionButton } from '@/components/ui/primary-action-button';
import { useSupabaseClients } from '@/hooks/useSupabaseClients';
import { useAppContext } from '@/context/AppContext';
import PhoneInput from '@/components/shared/PhoneInput';
import MultiEmailInput from '@/components/shared/MultiEmailInput';

const clientSchema = z.object({
  venue_name: z.string().min(1, 'Client name is required'),
  contact_name: z.string().optional(),
  email_address: z
    .string()
    .min(1, 'Email address is required')
    .refine(
      (val) => {
        if (!val || val.trim() === '') return false;
        const emails = val.split(',').map(e => e.trim()).filter(e => e.length > 0);
        return emails.every(email => z.string().email().safeParse(email).success);
      },
      { message: 'Please enter valid email address(es)' }
    ),
  location: z.string().optional(),
  phone: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface AddClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddClientDialog: React.FC<AddClientDialogProps> = ({ isOpen, onClose }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { fetchJobs } = useAppContext();
  const { addClient } = useSupabaseClients(async () => {
    await fetchJobs(true);
  });
  
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      venue_name: '',
      contact_name: '',
      email_address: '',
      location: '',
      phone: '',
    },
  });

  // Handle keyboard visibility for better scrolling on mobile
  useEffect(() => {
    const handleResize = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const initialHeight = window.innerHeight;
      const heightDiff = initialHeight - viewportHeight;
      
      // Keyboard is likely visible if viewport height is significantly reduced
      const keyboardVisible = heightDiff > 150;
      setIsKeyboardVisible(keyboardVisible);
      setKeyboardHeight(keyboardVisible ? heightDiff : 0);
    };

    const handleFocusIn = (e: FocusEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        // Small delay to allow keyboard to appear
        setTimeout(() => {
          const viewportHeight = window.visualViewport?.height || window.innerHeight;
          const initialHeight = window.innerHeight;
          const heightDiff = initialHeight - viewportHeight;
          const keyboardVisible = heightDiff > 100;
          setIsKeyboardVisible(keyboardVisible);
          setKeyboardHeight(keyboardVisible ? heightDiff : 0);
          
          // Auto-scroll to focused element when keyboard appears
          if (keyboardVisible && scrollContainerRef.current) {
            const focusedElement = e.target as HTMLElement;
            const container = scrollContainerRef.current;
            const elementRect = focusedElement.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            // Calculate if element is out of view
            const elementTop = elementRect.top - containerRect.top;
            const elementBottom = elementRect.bottom - containerRect.top;
            const visibleHeight = container.clientHeight;
            
            // Scroll to make element visible with some padding
            if (elementBottom > visibleHeight || elementTop < 0) {
              const scrollTop = container.scrollTop + elementTop - (visibleHeight / 3);
              container.scrollTo({
                top: Math.max(0, scrollTop),
                behavior: 'smooth'
              });
            }
          }
        }, 300);
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
      }, 300);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }
    
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const onSubmit = async (data: ClientFormData) => {
    const clientData = {
      venue_name: data.venue_name,
      contact_name: data.contact_name || undefined,
      email_address: data.email_address,
      location: data.location || undefined,
      phone: data.phone || undefined,
    };
    
    const result = await addClient(clientData);
    if (result) {
      form.reset();
      onClose();
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-[425px] w-full max-h-[90vh] sm:max-h-[80vh] flex flex-col rounded-2xl overflow-hidden overflow-x-hidden"
        style={{
          position: 'fixed',
          top: '15vh',
          left: '50%',
          transform: 'translateX(-50%)',
          margin: 0,
        }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-museio-purple">Add New Client</DialogTitle>
        </DialogHeader>
        <div 
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-scroll overflow-x-hidden px-1 scrollbar scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-w-2"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            touchAction: 'manipulation',
            maxHeight: isKeyboardVisible 
              ? `calc(95vh - ${Math.max(keyboardHeight, 200)}px)` 
              : 'calc(70vh - 100px)',
            minHeight: '250px',
            scrollbarWidth: 'thin', // Ensure scrollbar is always visible
            scrollbarGutter: 'stable', // Reserve space for scrollbar
          }}
        >
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="venue_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client (Venue or Company name) *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter venue or company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contact name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <MultiEmailInput
                      placeholder="Enter email addresses..."
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <PhoneInput
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Enter phone number"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <PrimaryActionButton 
                type="submit" 
                isLoading={form.formState.isSubmitting}
                loadingText="Adding..."
              >
                Add Client
              </PrimaryActionButton>
            </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddClientDialog;
