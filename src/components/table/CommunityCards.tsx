import type { Card as CardType } from '../../types/card';
import Card from './Card';

interface CommunityCardsProps {
  cards: CardType[];
}

export default function CommunityCards({ cards }: CommunityCardsProps) {
  return (
    <div
      className="flex gap-1.5 justify-center items-center rounded-2xl px-4 py-3"
      style={{
        background: 'rgba(0,0,0,0.18)',
        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.2)',
        minWidth: 310,
        minHeight: 86,
      }}
    >
      {cards.length === 0
        ? /* Empty slots */
          [0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-lg"
              style={{
                width: 54,
                height: 76,
                border: '2px dashed rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.02)',
              }}
            />
          ))
        : <>
            {cards.map((card, i) => (
              <Card key={`${card.rank}${card.suit}`} card={card} size="md" delay={i * 120} />
            ))}
            {Array.from({ length: 5 - cards.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="rounded-lg"
                style={{
                  width: 54,
                  height: 76,
                  border: '2px dashed rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.02)',
                }}
              />
            ))}
          </>
      }
    </div>
  );
}
