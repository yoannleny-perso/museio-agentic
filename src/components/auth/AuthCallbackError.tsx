
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface AuthCallbackErrorProps {
  error: string;
  children?: React.ReactNode; // Added children prop to interface
}

const supabaseAuthSettingsUrl = import.meta.env.VITE_SUPABASE_PROJECT_ID
  ? `https://supabase.com/dashboard/project/${import.meta.env.VITE_SUPABASE_PROJECT_ID}/auth/providers`
  : 'https://supabase.com/dashboard';

const AuthCallbackError: React.FC<AuthCallbackErrorProps> = ({ error, children }) => {
  const navigate = useNavigate();
  
  return (
    <>
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
      
      {children}
      
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button 
          onClick={() => navigate('/auth')}
          className="w-full"
        >
          Back to Sign In
        </Button>
        <Button
          variant="outline"
          onClick={() => window.open(supabaseAuthSettingsUrl, '_blank')}
          className="w-full"
        >
          Check Supabase Settings
        </Button>
      </div>
    </>
  );
};

export default AuthCallbackError;
