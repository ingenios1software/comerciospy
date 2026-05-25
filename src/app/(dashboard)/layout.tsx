"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';

function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50">
        <div className="rounded-3xl bg-slate-900/95 px-6 py-5 text-center shadow-soft ring-1 ring-white/10">
          <p className="text-sm text-slate-400">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardAuthGuard>{children}</DashboardAuthGuard>;
}
