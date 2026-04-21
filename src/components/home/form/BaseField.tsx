
import React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { FieldError, FieldErrorsImpl, Merge } from 'react-hook-form';

export interface BaseFieldProps {
  id: string;
  label: string;
  error?: string | FieldError | Merge<FieldError, FieldErrorsImpl<any>> | undefined;
  className?: string;
}

export const BaseField: React.FC<BaseFieldProps & { children: React.ReactNode }> = ({
  id,
  label,
  error,
  className,
  children
}) => {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p className="text-red-500 text-sm mt-1">
          {typeof error === 'string' 
            ? error 
            : error.message?.toString() || 'Invalid input'}
        </p>
      )}
    </div>
  );
};

export const getErrorClassNames = (error?: any): string => {
  return error ? "border-red-500 focus-visible:ring-red-500" : "";
};
