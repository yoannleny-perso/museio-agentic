
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

interface EmailFormProps {
  isLoading: boolean;
  mode: 'signin' | 'signup' | 'reset';
  onSubmit: (email: string, password: string) => Promise<void>;
  onToggleMode: (mode: 'signin' | 'signup' | 'reset') => void;
}

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const resetFormSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

const EmailForm: React.FC<EmailFormProps> = ({ isLoading, mode, onSubmit, onToggleMode }) => {
  const isResetMode = mode === 'reset';

  const [showPassword, setShowPassword] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(isResetMode ? resetFormSchema : formSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    await onSubmit(values.email, values.password);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isResetMode && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      {...field}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        // Eye open icon
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        // Eye closed icon
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.956 9.956 0 012.293-3.95m3.249-2.383A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.965 9.965 0 01-4.293 5.032M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                        </svg>
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
  
        <Button 
          type="submit" 
          className="w-full bg-[#8A71CF]" 
          disabled={isLoading}

        >
          {isLoading ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></span>
              {isResetMode ? 'Sending reset email...' : (mode === 'signin' ? 'Signing in...' : 'Signing up...')}
            </>
          ) : (
            isResetMode ? 'Send Reset Email' : (mode === 'signin' ? 'Sign In' : 'Sign Up')
          )}
        </Button>
        
        <div className="text-center space-y-2">
          {isResetMode ? (
            <Button 
              variant="link" 
              type="button"
              onClick={() => onToggleMode('signin')}
              disabled={isLoading}
              className='text-[#8A71CF] bg-transparent'
            >
              Back to Sign In
            </Button>
          ) : (
            <>
              <Button 
                variant="link" 
                type="button"
                onClick={() => onToggleMode(mode === 'signin' ? 'signup' : 'signin')}
                disabled={isLoading}
                className='text-[#8A71CF] bg-transparent'
              >
                {mode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
              </Button>
              {mode === 'signin' && (
                <div>
                  <Button 
                    variant="link" 
                    type="button"
                    onClick={() => onToggleMode('reset')}
                    disabled={isLoading}
                    className='text-[#8A71CF] bg-transparent'

                  >
                    Forgot password?
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </form>
    </Form>
  );
};

export default EmailForm;
