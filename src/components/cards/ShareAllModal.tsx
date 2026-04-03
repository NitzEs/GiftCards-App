'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';

interface ShareAllModalProps {
  open: boolean;
  onClose: () => void;
}

interface PendingInvite {
  email: string;
  inviteLink: string;
  inviterName: string;
}

export function ShareAllModal({ open, onClose }: ShareAllModalProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingInvite, setPendingInvite] = useState<PendingInvite | null>(null);

  function handleClose() {
    setPendingInvite(null);
    setEmail('');
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/share-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ inviteeEmail: email }),
      });

      const data = await res.json() as { pending?: boolean; inviteLink?: string; inviterName?: string; error?: string };

      if (!res.ok) {
        throw new Error(data.error || 'error');
      }

      if (data.pending) {
        // User not registered — show invitation UI
        setPendingInvite({
          email,
          inviteLink: data.inviteLink ?? 'https://gift-cards-app-six.vercel.app/register',
          inviterName: data.inviterName ?? '',
        });
      } else {
        showToast('הרשימה שותפה בהצלחה! 🎉');
        handleClose();
      }
    } catch {
      showToast(t('genericError'), 'error');
    } finally {
      setLoading(false);
    }
  }

  function buildMailtoLink(invite: PendingInvite): string {
    const subject = encodeURIComponent('הוזמנת לשתף כרטיסי מתנה');
    const body = encodeURIComponent(
      `שלום!\n\n${invite.inviterName} מזמין אותך לנהל כרטיסי מתנה ביחד באפליקציה.\n\nהירשם בחינם כאן:\n${invite.inviteLink}\n\nלאחר ההרשמה עם כתובת המייל הזו, השיתוף יופעל אוטומטית.`
    );
    return `mailto:${invite.email}?subject=${subject}&body=${body}`;
  }

  return (
    <Modal open={open} onClose={handleClose} title="שיתוף כל הרשימה">
      {!pendingInvite ? (
        <>
          <p className="text-sm text-gray-500">
            כל הכרטיסים (קיימים וחדשים) יהיו משותפים ביניכם — עדכון אצלך יתעדכן אצלו ולהפך.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="אימייל המשתמש"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="partner@example.com"
              dir="ltr"
            />
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="secondary" onClick={handleClose}>
                {t('cancel')}
              </Button>
              <Button type="submit" loading={loading}>
                שתף רשימה
              </Button>
            </div>
          </form>
        </>
      ) : (
        /* Invitation screen — shown when invitee is not registered yet */
        <div className="flex flex-col gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <p className="text-2xl mb-1">📧</p>
            <p className="font-medium text-gray-800">המשתמש עדיין לא רשום</p>
            <p className="text-sm text-gray-500 mt-1">
              שלח לו הזמנה — ברגע שיירשם עם הכתובת{' '}
              <span className="font-medium text-blue-700" dir="ltr">{pendingInvite.email}</span>
              {' '}השיתוף יופעל אוטומטית.
            </p>
          </div>

          <a
            href={buildMailtoLink(pendingInvite)}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl px-4 py-3 transition"
          >
            ✉️ פתח אימייל עם הזמנה מוכנה
          </a>

          <div className="flex flex-col gap-1">
            <p className="text-xs text-gray-500 text-center">או שתף את לינק ההרשמה ישירות:</p>
            <div
              className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-blue-600 text-center cursor-pointer hover:bg-gray-100 transition break-all"
              dir="ltr"
              onClick={() => {
                navigator.clipboard?.writeText(pendingInvite.inviteLink).catch(() => {});
                showToast('הלינק הועתק');
              }}
            >
              {pendingInvite.inviteLink}
            </div>
            <p className="text-xs text-gray-400 text-center">לחץ לעתיקה</p>
          </div>

          <Button variant="secondary" onClick={handleClose} className="w-full">
            סגור
          </Button>
        </div>
      )}
    </Modal>
  );
}
