
import React, { forwardRef } from 'react';
import { ModalInput } from '@/components/ui/modal-input';
import { cn } from '@/lib/utils';
import { FieldError, FieldErrorsImpl, Merge } from 'react-hook-form';
import { BaseField, getErrorClassNames } from './BaseField';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string | FieldError | Merge<FieldError, FieldErrorsImpl<any>> | undefined;
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  error,
  className,
  ...props
}, ref) => {
  return (
    <BaseField id={id} label={label} error={error}>
      <ModalInput 
        ref={ref}
        id={id} 
        type={type}
        placeholder={placeholder}
        className={cn(
          "input-field",
          "placeholder:text-gray-300", // Tailwind class for blue placeholder
          getErrorClassNames(error),
          className
        )}
        value={value}
        onChange={onChange}
        required={required}
        aria-invalid={!!error}
        {...props}
      />
    </BaseField>
  );
});

FormField.displayName = 'FormField';

export default FormField;
