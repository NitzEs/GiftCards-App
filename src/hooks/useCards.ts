'use client';

import { useEffect, useState } from 'react';
import { subscribeToCards } from '@/lib/firestore/cards';
import { GiftCard } from '@/types/card';
import { useAuth } from '@/context/AuthContext';

export function useCards() {
  const { user } = useAuth();
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setCards([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeToCards(
      user.uid,
      (updatedCards) => {
        setCards(updatedCards);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [user]);

  return { cards, loading, error };
}
