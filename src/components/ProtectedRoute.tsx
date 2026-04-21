
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/auth";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, session, loading } = useAuth();
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading</h2>
          <p className="text-gray-500">Please wait...</p>
        </div>
      </div>
    );
  }
  
  // Check if session is valid and not expired (aligned with AuthProvider logic)
  const isSessionValid = () => {
    if (!session) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at;
    
    // Check if session is expired (with 5 minute buffer for refresh - same as AuthProvider)
    if (expiresAt && expiresAt <= now + 300) {
      console.log('[PROTECTED_ROUTE] Session has expired or about to expire');
      return false;
    }
    
    return true;
  };
  
  // Redirect to auth page if not authenticated or session is invalid
  if (!user || !session || !isSessionValid()) {
    console.log('[PROTECTED_ROUTE] Access denied - redirecting to /auth');
    return <Navigate to="/auth" />;
  }
  
  // Render children if authenticated and session is valid
  return <>{children}</>;
};

export default ProtectedRoute;
