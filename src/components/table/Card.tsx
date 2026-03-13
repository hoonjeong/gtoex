import type { Card as CardType } from '../../types/card';
import { SUIT_SYMBOLS, RANK_DISPLAY } from '../../types/card';

interface CardProps {
  card: CardType;
  size?: 'sm' | 'md' | 'lg';
  delay?: number;
  faceDown?: boolean;
}

const dimensions = {
  sm: { w: 42, h: 60, rank: 18, suit: 15 },
  md: { w: 54, h: 76, rank: 24, suit: 20 },
  lg: { w: 72, h: 102, rank: 32, suit: 28 },
};

function suitColor(suit: CardType['suit']): string {
  return suit === 'heart' || suit === 'diamond' ? '#dc2626' : '#18181b';
}

export default function Card({ card, size = 'md', delay = 0, faceDown = false }: CardProps) {
  const d = dimensions[size];

  if (faceDown) {
    return (
      <div
        className="rounded-lg animate-deal flex-shrink-0"
        style={{
          width: d.w,
          height: d.h,
          animationDelay: `${delay}ms`,
          background: `
            linear-gradient(135deg, #1e3a8a 0%, #2563eb 45%, #1e3a8a 100%)
          `,
          border: '2px solid #3b82f6',
          boxShadow: '0 3px 12px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        {/* Diamond pattern */}
        <div className="w-full h-full rounded-md opacity-20 flex items-center justify-center">
          <div className="w-[60%] h-[70%] border-2 border-blue-300 rounded-sm rotate-45" />
        </div>
      </div>
    );
  }

  const symbol = SUIT_SYMBOLS[card.suit];
  const rank = RANK_DISPLAY[card.rank];
  const color = suitColor(card.suit);

  return (
    <div
      className="rounded-lg animate-deal flex-shrink-0 select-none relative overflow-hidden"
      style={{
        width: d.w,
        height: d.h,
        animationDelay: `${delay}ms`,
        background: 'linear-gradient(170deg, #ffffff 0%, #f7f7f0 40%, #edede5 100%)',
        border: '1.5px solid #c8c8c0',
        boxShadow: '0 3px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.8)',
      }}
    >
      {/* Top-left rank+suit */}
      <div className="absolute flex flex-col items-center leading-none" style={{ top: 2, left: 3 }}>
        <span style={{ fontSize: d.rank * 0.75, color, fontWeight: 800, lineHeight: 1 }}>{rank}</span>
        <span style={{ fontSize: d.suit * 0.6, color, lineHeight: 1, marginTop: 1 }}>{symbol}</span>
      </div>

      {/* Center suit (large) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{ fontSize: d.suit * 1.8, color, opacity: 0.85, lineHeight: 1 }}>{symbol}</span>
      </div>

      {/* Bottom-right rank+suit (inverted) */}
      <div className="absolute flex flex-col items-center leading-none rotate-180" style={{ bottom: 2, right: 3 }}>
        <span style={{ fontSize: d.rank * 0.75, color, fontWeight: 800, lineHeight: 1 }}>{rank}</span>
        <span style={{ fontSize: d.suit * 0.6, color, lineHeight: 1, marginTop: 1 }}>{symbol}</span>
      </div>
    </div>
  );
}
