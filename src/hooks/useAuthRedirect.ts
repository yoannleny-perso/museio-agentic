
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';

export const useAuthRedirect = (redirectTo: string = '/') => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if we've finished checking auth status and no user is found
    if (!loading && !user) {
      console.log('No authenticated user found, redirecting to /auth');
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  return { user, loading };
};
