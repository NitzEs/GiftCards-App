'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/Button';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { addSharedUser } from '@/lib/firestore/cards';

export default function InvitePage() {
  const params = useParams();
  const token = params.token as string;
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'ready' | 'accepted' | 'invalid'>('loading');
  const [accepting, setAccepting] = useState(false);
  const [inviterEmail, setInviterEmail] = useState('');
  const [cardName, setCardName] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?redirect=/invite/${token}`);
      return;
    }
    loadInvitation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  async function loadInvitation() {
    try {
      const invSnap = await getDoc(doc(db, 'invitations', token));
      if (!invSnap.exists() || invSnap.data().status !== 'pending') {
        setStatus('invalid');
        return;
      }
      const data = invSnap.data();
      // Check expiry
      if (data.expiresAt?.toDate() < new Date()) {
        setStatus('invalid');
        return;
      }
      setInviterEmail(data.inviterEmail);
      // Load card name
      const cardSnap = await getDoc(doc(db, 'cards', data.cardId));
      if (cardSnap.exists()) setCardName(cardSnap.data().name);
      setStatus('ready');
    } catch {
      setStatus('invalid');
    }
  }

  async function handleAccept() {
    if (!user) return;
    setAccepting(true);
    try {
      const invSnap = await getDoc(doc(db, 'invitations', token));
      const data = invSnap.data()!;
      // Add user to sharedWith
      await addSharedUser(data.cardId, user.uid);
      // Mark invitation accepted
      await updateDoc(doc(db, 'invitations', token), {
        status: 'accepted',
        updatedAt: serverTimestamp(),
      });
      setStatus('accepted');
      setTimeout(() => router.replace('/dashboard'), 2000);
    } catch {
      setStatus('invalid');
    } finally {
      setAccepting(false);
    }
  }

  if (status === 'loading' || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center flex flex-col gap-6">
        <div className="text-5xl">🎁</div>

        {status === 'ready' && (
          <>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('invitationTitle')}</h1>
              <p className="text-sm text-gray-500 mt-2">
                {inviterEmail} {cardName && `→ "${cardName}"`}
              </p>
            </div>
            <Button onClick={handleAccept} loading={accepting} size="lg">
              {t('acceptInvitation')}
            </Button>
          </>
        )}

        {status === 'accepted' && (
          <div className="text-green-600 font-semibold text-lg">{t('invitationAccepted')} ✓</div>
        )}

        {status === 'invalid' && (
          <div className="text-red-600 font-semibold">{t('invitationInvalid')}</div>
        )}
      </div>
    </div>
  );
}
