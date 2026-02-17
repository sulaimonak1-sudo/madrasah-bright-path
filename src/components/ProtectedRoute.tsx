import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'teacher';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Must have admin or teacher role to access admin area
  if (!role || (role !== 'admin' && role !== 'teacher')) {
    return <Navigate to="/admin/login" replace />;
  }

  // If a specific role is required (e.g. admin-only pages)
  if (requiredRole === 'admin' && role !== 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};
