'use client';

import { GiftCard } from '@/types/card';
import { CardItem } from './CardItem';
import { EmptyState } from '@/components/layout/EmptyState';

interface CardListProps {
  cards: GiftCard[];
  onAddCard: () => void;
}

export function CardList({ cards, onAddCard }: CardListProps) {
  if (cards.length === 0) {
    return <EmptyState onAddCard={onAddCard} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <CardItem key={card.id} card={card} />
      ))}
    </div>
  );
}
