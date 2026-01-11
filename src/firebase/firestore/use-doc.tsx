'use client';
import {
  onSnapshot,
  doc,
  type DocumentData,
  type DocumentReference,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

interface UseDocOptions<T> {
  deps?: any[];
  ref?: DocumentReference<T> | null;
}

export function useDoc<T extends DocumentData>({
  ref,
  deps = [],
}: UseDocOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ref) {
      setLoading(false);
      setData(null);
      return;
    }

    const unsubscribe = onSnapshot(ref, (snapshot) => {
      if (snapshot.exists()) {
        setData({
          ...snapshot.data(),
          id: snapshot.id,
        } as T);
      } else {
        setData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, ...deps]);

  return { data, loading };
}
