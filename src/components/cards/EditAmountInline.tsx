'use client';

import React, { useState, useRef, useEffect } from 'react';
import { updateCardAmount } from '@/lib/firestore/cards';
import { useToast } from '@/components/ui/Toast';
import { useLanguage } from '@/context/LanguageContext';

interface EditAmountInlineProps {
  cardId: string;
  amount: number;
  isOwnerOrShared: boolean;
}

export function EditAmountInline({ cardId, amount, isOwnerOrShared }: EditAmountInlineProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(amount));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    setValue(String(amount));
  }, [amount]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  async function save() {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      setEditing(false);
      setValue(String(amount));
      return;
    }
    setSaving(true);
    try {
      await updateCardAmount(cardId, num);
      showToast(t('save') + ' ✓');
    } catch {
      showToast(t('genericError'), 'error');
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') {
      setValue(String(amount));
      setEditing(false);
    }
  }

  if (!isOwnerOrShared) {
    return (
      <span className="text-2xl font-bold text-green-700">
        ₪{amount.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
      </span>
    );
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xl font-bold text-green-700">₪</span>
        <input
          ref={inputRef}
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={handleKeyDown}
          disabled={saving}
          className="w-24 text-xl font-bold text-green-700 border-b-2 border-blue-500 outline-none bg-transparent"
          dir="ltr"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title={t('editAmount')}
      className="group flex items-center gap-1 hover:opacity-80 transition"
    >
      <span className="text-2xl font-bold text-green-700">
        ₪{amount.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
      </span>
      <svg
        className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition opacity-0 group-hover:opacity-100"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
    </button>
  );
}
