import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  Unsubscribe,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { GiftCard } from '@/types/card';

function toGiftCard(id: string, data: Record<string, unknown>): GiftCard {
  return {
    id,
    ownerId: data.ownerId as string,
    name: data.name as string,
    number: data.number as string,
    numberLast4: data.numberLast4 as string,
    expiry: data.expiry as string,
    amount: data.amount as number,
    originalAmount: data.originalAmount as number,
    sharedWith: (data.sharedWith as string[]) || [],
    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
  };
}

export function subscribeToCards(
  uid: string,
  onUpdate: (cards: GiftCard[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const cardsRef = collection(db, 'cards');
  let ownCards: GiftCard[] = [];
  let sharedCards: GiftCard[] = [];

  function merge() {
    const all = [...ownCards];
    sharedCards.forEach((sc) => {
      if (!all.find((c) => c.id === sc.id)) all.push(sc);
    });
    all.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    onUpdate(all);
  }

  const q1 = query(cardsRef, where('ownerId', '==', uid));
  const unsub1 = onSnapshot(
    q1,
    (snap) => {
      ownCards = snap.docs.map((d) => toGiftCard(d.id, d.data() as Record<string, unknown>));
      merge();
    },
    onError
  );

  const q2 = query(cardsRef, where('sharedWith', 'array-contains', uid));
  const unsub2 = onSnapshot(
    q2,
    (snap) => {
      sharedCards = snap.docs.map((d) => toGiftCard(d.id, d.data() as Record<string, unknown>));
      merge();
    },
    onError
  );

  return () => {
    unsub1();
    unsub2();
  };
}

export async function updateCardAmount(cardId: string, amount: number): Promise<void> {
  await updateDoc(doc(db, 'cards', cardId), {
    amount,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCard(cardId: string): Promise<void> {
  await deleteDoc(doc(db, 'cards', cardId));
}

export async function addSharedUser(cardId: string, uid: string): Promise<void> {
  const { arrayUnion } = await import('firebase/firestore');
  await updateDoc(doc(db, 'cards', cardId), {
    sharedWith: arrayUnion(uid),
    updatedAt: serverTimestamp(),
  });
}
