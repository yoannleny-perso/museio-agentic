
import React from 'react';
import { useAuth } from '@/context/auth';
import { Navigate } from 'react-router-dom';
import Landing from '@/pages/Landing';
import { Capacitor } from '@capacitor/core';

const ConditionalLanding = () => {
  const { user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7209B7] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, redirect to jobs page
  if (user) {
    return <Navigate to="/app/home" replace />;
  }

  // If user is not authenticated, show landing page
  if (Capacitor.isNativePlatform()) {
    return <Navigate to="/auth" replace />;
  }

  return <Landing />;
};

export default ConditionalLanding;
