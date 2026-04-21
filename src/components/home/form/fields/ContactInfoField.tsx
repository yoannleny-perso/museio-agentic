
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import PhoneInput from '@/components/shared/PhoneInput';

interface ContactInfoFieldProps {
  form: UseFormReturn<any>;
}

const ContactInfoField: React.FC<ContactInfoFieldProps> = ({ form }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
      <FormField
        control={form.control}
        name="contact_email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Client email</FormLabel>
            <FormControl>
              <Input
                placeholder="client@example.com"
                type="email"
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="contact_phone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Client phone</FormLabel>
            <FormControl>
              <PhoneInput
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="(123) 456-7890"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default ContactInfoField;
