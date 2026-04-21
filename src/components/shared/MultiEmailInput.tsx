import React, { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiEmailInputProps {
  value: string; // Comma-separated email string
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const MultiEmailInput: React.FC<MultiEmailInputProps> = ({
  value,
  onChange,
  placeholder = "Enter email addresses...",
  className
}) => {
  const [inputValue, setInputValue] = useState('');
  const [invalidEmail, setInvalidEmail] = useState('');

  // Parse existing emails from comma-separated string
  const emails = value
    ? value.split(',').map(e => e.trim()).filter(e => e.length > 0)
    : [];

  // Simple email validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Add email to the list
  const addEmail = (email: string) => {
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) return;

    if (!isValidEmail(trimmedEmail)) {
      setInvalidEmail(trimmedEmail);
      return;
    }

    // Check for duplicates
    if (emails.includes(trimmedEmail)) {
      setInputValue('');
      return;
    }

    // Add email to list
    const newEmails = [...emails, trimmedEmail];
    onChange(newEmails.join(', '));
    setInputValue('');
    setInvalidEmail('');
  };

  // Remove email from the list
  const removeEmail = (indexToRemove: number) => {
    const newEmails = emails.filter((_, index) => index !== indexToRemove);
    onChange(newEmails.join(', '));
  };

  // Handle key press
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
      e.preventDefault();
      addEmail(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && emails.length > 0) {
      // Remove last email if backspace on empty input
      removeEmail(emails.length - 1);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setInvalidEmail('');

    // Auto-add on comma or semicolon
    if (val.includes(',') || val.includes(';')) {
      const parts = val.split(/[,;]/).map(p => p.trim()).filter(p => p.length > 0);
      parts.forEach(part => addEmail(part));
      setInputValue('');
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const pastedEmails = pastedText.split(/[,;\s]+/).map(e => e.trim()).filter(e => e.length > 0);
    
    pastedEmails.forEach(email => addEmail(email));
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap gap-2 p-3 rounded-md border border-input bg-background min-h-[42px] focus-within:ring-2 focus-within:ring-museio-purple-light focus-within:ring-offset-2">
        {emails.map((email, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-300 text-sm"
          >
            {email}
            <button
              type="button"
              onClick={() => removeEmail(index)}
              className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
              aria-label={`Remove ${email}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => addEmail(inputValue)}
          placeholder={emails.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[10rem] outline-none bg-transparent text-base placeholder:text-muted-foreground sm:min-w-[200px]"
        />
      </div>
      {invalidEmail && (
        <p className="text-sm text-destructive">
          Invalid email: {invalidEmail}
        </p>
      )}
    </div>
  );
};

export default MultiEmailInput;
