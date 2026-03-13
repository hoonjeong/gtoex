import { formatBB } from '../../utils/format';

interface BetChipProps {
  amount: number;
  x: number;
  y: number;
  isHero?: boolean;
  isVillain?: boolean;
}

/**
 * 테이블 위 플레이어 근처에 표시되는 벳 칩 + 금액
 */
export default function BetChip({ amount, x, y, isHero, isVillain }: BetChipProps) {
  if (amount <= 0) return null;

  // 칩 색상: 히어로=파랑, 빌런=빨강, 나머지=기본
  let chipBg = 'linear-gradient(135deg, #fbbf24, #f59e0b)';
  let chipBorder = '#92400e';
  let textColor = 'text-amber-100';

  if (isHero) {
    chipBg = 'linear-gradient(135deg, #60a5fa, #3b82f6)';
    chipBorder = '#1e40af';
    textColor = 'text-blue-100';
  } else if (isVillain) {
    chipBg = 'linear-gradient(135deg, #f87171, #ef4444)';
    chipBorder = '#991b1b';
    textColor = 'text-red-100';
  }

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-fade-in"
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        zIndex: 10,
      }}
    >
      <div className="flex flex-col items-center gap-0.5">
        {/* 칩 스택 (2~3개 겹쳐진 모양) */}
        <div className="relative" style={{ width: 22, height: 18 }}>
          {/* 아래 칩 (그림자 역할) */}
          <div
            className="absolute rounded-full"
            style={{
              width: 18,
              height: 18,
              left: 2,
              top: 2,
              background: 'rgba(0,0,0,0.3)',
              filter: 'blur(2px)',
            }}
          />
          {/* 메인 칩 */}
          <div
            className="absolute rounded-full"
            style={{
              width: 18,
              height: 18,
              left: 2,
              top: 0,
              background: chipBg,
              border: `2px dashed ${chipBorder}`,
              boxShadow: `0 2px 4px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.3)`,
            }}
          />
        </div>
        {/* 금액 텍스트 */}
        <span
          className={`${textColor} font-bold leading-none whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]`}
          style={{ fontSize: 10 }}
        >
          {formatBB(amount)}
        </span>
      </div>
    </div>
  );
}
