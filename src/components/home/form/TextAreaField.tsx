
import React, { forwardRef } from 'react';
import { ModalTextarea } from '@/components/ui/modal-textarea';
import { cn } from '@/lib/utils';
import { FieldError, FieldErrorsImpl, Merge } from 'react-hook-form';
import { BaseField, getErrorClassNames } from './BaseField';

interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  label: string;
  error?: string | FieldError | Merge<FieldError, FieldErrorsImpl<any>> | undefined;
}

const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(({
  id,
  label,
  placeholder,
  value,
  onChange,
  error,
  className,
  ...props
}, ref) => {
  return (
    <BaseField id={id} label={label} error={error}>
      <ModalTextarea 
        ref={ref}
        id={id} 
        placeholder={placeholder} 
        className={cn(
          "input-field", 
          "placeholder:text-gray-300", // Tailwind class for blue placeholder
          getErrorClassNames(error),
          className
        )}
        value={value}
        onChange={onChange}
        aria-invalid={!!error}
        {...props}
      />
    </BaseField>
  );
});

TextAreaField.displayName = 'TextAreaField';

export default TextAreaField;
