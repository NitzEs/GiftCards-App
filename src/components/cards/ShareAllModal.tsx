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

const APP_URL = 'https://gift-cards-app-six.vercel.app/register';

export function ShareAllModal({ open, onClose }: ShareAllModalProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  function handleClose() {
    setEmail('');
    onClose();
  }

  // Direct share for already-registered users
  async function handleDirectShare(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !email) return;
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

      const data = await res.json() as { pending?: boolean; inviterName?: string };

      if (!res.ok) throw new Error();

      if (data.pending) {
        showToast('ההזמנה נשמרה — שלח לו את הלינק בוואטסאפ או במייל');
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

  function getInviterName(): string {
    return user?.displayName || user?.email || 'חבר';
  }

  function buildWhatsAppLink(): string {
    const name = getInviterName();
    const text = encodeURIComponent(
      `היי! ${name} מזמין אותך לנהל כרטיסי מתנה ביחד 🎁\n\nהירשם בחינם:\n${APP_URL}\n\nאחרי ההרשמה עם המייל שלך — השיתוף יופעל אוטומטית.`
    );
    return `https://wa.me/?text=${text}`;
  }

  function buildMailtoLink(): string {
    const name = getInviterName();
    const subject = encodeURIComponent('הוזמנת לשתף כרטיסי מתנה 🎁');
    const body = encodeURIComponent(
      `שלום!\n\n${name} מזמין אותך לנהל כרטיסי מתנה ביחד באפליקציה.\n\nהירשם בחינם:\n${APP_URL}\n\nאחרי ההרשמה עם המייל שלך — השיתוף יופעל אוטומטית.`
    );
    const to = email ? email : '';
    return `mailto:${to}?subject=${subject}&body=${body}`;
  }

  return (
    <Modal open={open} onClose={handleClose} title="שיתוף כל הרשימה">
      <p className="text-sm text-gray-500">
        כל הכרטיסים (קיימים וחדשים) יהיו משותפים ביניכם — עדכון אצלך יתעדכן אצלו ולהפך.
      </p>

      {/* Send invitation via WhatsApp / Email */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-gray-700">שלח הזמנה:</p>
        <div className="flex gap-2">
          <a
            href={buildWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl px-4 py-3 transition text-sm"
          >
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            וואטסאפ
          </a>
          <a
            href={buildMailtoLink()}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl px-4 py-3 transition text-sm"
          >
            ✉️ מייל
          </a>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-xs text-gray-400">או — אם הוא כבר רשום</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      {/* Direct share for registered users */}
      <form onSubmit={handleDirectShare} className="flex flex-col gap-3">
        <Input
          label="אימייל המשתמש הרשום"
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
            שתף רשימה ישירות
          </Button>
        </div>
      </form>
    </Modal>
  );
}
