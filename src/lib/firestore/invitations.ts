import {
  collection,
  query,
  where,
  onSnapshot,
  Unsubscribe,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Invitation } from '@/types/invitation';

function toInvitation(id: string, data: Record<string, unknown>): Invitation {
  return {
    id,
    inviterUid: data.inviterUid as string,
    inviterEmail: data.inviterEmail as string,
    inviteeEmail: data.inviteeEmail as string,
    cardId: data.cardId as string,
    status: data.status as Invitation['status'],
    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    expiresAt: (data.expiresAt as Timestamp)?.toDate() ?? new Date(),
  };
}

export function subscribeToPendingInvitations(
  email: string,
  onUpdate: (invitations: Invitation[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'invitations'),
    where('inviteeEmail', '==', email),
    where('status', '==', 'pending')
  );
  return onSnapshot(q, (snap) => {
    onUpdate(snap.docs.map((d) => toInvitation(d.id, d.data() as Record<string, unknown>)));
  });
}
