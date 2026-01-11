'use client';
import { useAuth } from '@/firebase/provider';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useEffect, useState } from 'react';

export function useUser() {
  const [user, setUser] = useState<{
    data: User | null;
    loading: boolean;
  }>({ data: null, loading: true });
  const auth = useAuth();
  useEffect(() => {
    if (!auth) {
      setUser({ data: null, loading: false });
      return;
    }
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser({ data: user, loading: false });
      },
      () => {
        setUser({ data: null, loading: false });
      }
    );
    return () => unsubscribe();
  }, [auth]);

  return user;
}
