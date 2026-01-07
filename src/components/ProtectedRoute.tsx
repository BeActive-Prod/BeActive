'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/share', '/register'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  useEffect(() => {
    if (!isLoading) {
      if (!user && !isPublicRoute) {
        // Not logged in and trying to access protected route
        router.push('/login');
      } else if (user && pathname === '/login') {
        // Already logged in and trying to access login page
        router.push('/');
      }
    }
  }, [user, isLoading, pathname, isPublicRoute, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Allow access to public routes
  if (isPublicRoute) {
    return children;
  }

  // Allow access to protected routes only if logged in
  if (user) {
    return children;
  }

  // Redirect to login (this will be handled by useEffect)
  return null;
}
