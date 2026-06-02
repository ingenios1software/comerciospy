"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { getAuthInstance } from '@/lib/firebase/auth';

function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [checkingRedirect, setCheckingRedirect] = useState(false);

  useEffect(() => {
    if (loading || user) {
      setCheckingRedirect(false);
      return undefined;
    }

    setCheckingRedirect(true);

    const timeoutId = window.setTimeout(() => {
      let hasCurrentUser = false;

      try {
        hasCurrentUser = Boolean(getAuthInstance().currentUser);
      } catch {
        hasCurrentUser = false;
      }

      if (!hasCurrentUser) {
        router.replace('/login');
      }
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [loading, user, router]);

  if (loading || !user || checkingRedirect) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-slate-950">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-center shadow-soft">
          <p className="text-sm text-slate-500">Verificando sesion...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardAuthGuard>{children}</DashboardAuthGuard>;
}
