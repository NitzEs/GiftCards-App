'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';

interface ShareCardModalProps {
  open: boolean;
  cardId: string;
  onClose: () => void;
}

export function ShareCardModal({ open, cardId, onClose }: ShareCardModalProps) {
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
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ cardId, inviteeEmail: email }),
      });
      if (res.status === 409) {
        showToast(t('alreadyShared'), 'info');
      } else if (!res.ok) {
        throw new Error();
      } else {
        showToast(t('invitationSent'));
        setEmail('');
        onClose();
      }
    } catch {
      showToast(t('invitationError'), 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('shareCard')}>
      <p className="text-sm text-gray-500">{t('inviteByEmail')}</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label={t('inviteeEmail')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="friend@example.com"
          dir="ltr"
        />
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button type="submit" loading={loading}>
            {t('sendInvitation')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
