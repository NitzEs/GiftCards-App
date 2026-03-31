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

export function ShareAllModal({ open, onClose }: ShareAllModalProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

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

      if (res.status === 404) {
        showToast('משתמש עם אימייל זה לא נמצא — עליו להירשם קודם', 'error');
      } else if (!res.ok) {
        throw new Error();
      } else {
        showToast('הרשימה שותפה בהצלחה! 🎉');
        setEmail('');
        onClose();
      }
    } catch {
      showToast(t('genericError'), 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="שיתוף כל הרשימה">
      <p className="text-sm text-gray-500">
        כל הכרטיסים (קיימים וחדשים) יהיו משותפים ביניכם — עדכון אצלך יתעדכן אצלו ולהפך.
      </p>
      <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
        ⚠️ המשתמש חייב להיות רשום באפליקציה עם אותו אימייל.
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
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button type="submit" loading={loading}>
            שתף רשימה
          </Button>
        </div>
      </form>
    </Modal>
  );
}
