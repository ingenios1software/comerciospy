"use client";

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { getAuthInstance, logoutUser } from './auth';
import { createUserProfile, getUserProfile } from './firestore';
import type { UsuarioApp } from '@/types';

type AuthContextType = {
  user: User | null;
  profile: UsuarioApp | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UsuarioApp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      try {
        if (currentUser) {
          const profileData = await getUserProfile(currentUser.uid);

          if (profileData) {
            setProfile(profileData);
          } else if (currentUser.providerData.some((provider) => provider.providerId === 'google.com')) {
            const newProfile: UsuarioApp = {
              id: currentUser.uid,
              nombre: currentUser.displayName ?? currentUser.email?.split('@')[0] ?? 'Usuario',
              email: currentUser.email ?? '',
              rol: 'usuario',
              activo: true,
              creadoEn: new Date().toISOString()
            };

            await createUserProfile(newProfile);
            setProfile(newProfile);
          } else {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      logout: async () => {
        await logoutUser();
      }
    }),
    [user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
