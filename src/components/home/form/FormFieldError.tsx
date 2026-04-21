
import React from 'react';

interface FormFieldErrorProps {
  error?: string;
}

const FormFieldError: React.FC<FormFieldErrorProps> = ({ error }) => {
  if (!error) return null;
  
  return (
    <div className="text-sm text-red-500 mt-1">{error}</div>
  );
};

export default FormFieldError;
