'use client';

import { useEffect, useState } from 'react';
import { subscribeToPendingInvitations } from '@/lib/firestore/invitations';
import { Invitation } from '@/types/invitation';
import { useAuth } from '@/context/AuthContext';

export function useInvitations() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  useEffect(() => {
    if (!user?.email) return;
    const unsub = subscribeToPendingInvitations(user.email, setInvitations);
    return unsub;
  }, [user]);

  return { invitations };
}
