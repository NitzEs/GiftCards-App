'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/context/LanguageContext';
import { deleteCard } from '@/lib/firestore/cards';
import { useToast } from '@/components/ui/Toast';

interface DeleteCardDialogProps {
  open: boolean;
  cardId: string;
  cardName: string;
  onClose: () => void;
}

export function DeleteCardDialog({ open, cardId, cardName, onClose }: DeleteCardDialogProps) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteCard(cardId);
      showToast(`${cardName} נמחק`);
      onClose();
    } catch {
      showToast(t('genericError'), 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('deleteCard')}>
      <p className="text-gray-700">{t('deleteConfirm')}</p>
      <p className="text-sm text-gray-500">{t('deleteWarning')}</p>
      <div className="flex gap-3 justify-end pt-2">
        <Button variant="secondary" onClick={onClose}>
          {t('cancel')}
        </Button>
        <Button variant="danger" loading={loading} onClick={handleDelete}>
          {t('delete')}
        </Button>
      </div>
    </Modal>
  );
}
