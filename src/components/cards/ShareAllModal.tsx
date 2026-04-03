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

  function buildWhatsAppLink(invite: PendingInvite): string {
    const text = encodeURIComponent(
      `שלום! ${invite.inviterName} מזמין אותך לנהל כרטיסי מתנה ביחד 🎁\n\nהירשם בחינם כאן:\n${invite.inviteLink}\n\nאחרי ההרשמה עם המייל שלך — השיתוף יופעל אוטומטית.`
    );
    return `https://wa.me/?text=${text}`;
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

          <div className="flex flex-col gap-2">
            <a
              href={buildWhatsAppLink(pendingInvite)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl px-4 py-3 transition"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              שלח בוואטסאפ
            </a>
            <a
              href={buildMailtoLink(pendingInvite)}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl px-4 py-3 transition"
            >
              ✉️ שלח במייל
            </a>
          </div>

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
