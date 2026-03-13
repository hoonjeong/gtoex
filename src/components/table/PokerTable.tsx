import type { Card as CardType } from '../../types/card';
import type { GameFormat, Position, PlayerAction, Street } from '../../types/game';
import { POSITIONS_6MAX, POSITIONS_9MAX, SEAT_ANGLES_6MAX, SEAT_ANGLES_9MAX } from '../../constants/positions';
import Seat, { stadiumPoint } from './Seat';
import CommunityCards from './CommunityCards';
import PotDisplay from './PotDisplay';
import BetChip from './BetChip';

interface PokerTableProps {
  format: GameFormat;
  heroPosition: Position;
  villainPosition: Position | null;
  communityCards: CardType[];
  pot: number;
  actions: PlayerAction[];
  street: Street;
}

export default function PokerTable({
  format,
  heroPosition,
  villainPosition,
  communityCards,
  pot,
  actions,
  street,
}: PokerTableProps) {
  const positions = format === '6max' ? POSITIONS_6MAX : POSITIONS_9MAX;
  const baseAngles = format === '6max' ? SEAT_ANGLES_6MAX : SEAT_ANGLES_9MAX;

  // 히어로가 항상 하단 중앙(90°)에 오도록 각도 회전
  const heroBaseAngle = (baseAngles as Record<string, number>)[heroPosition] || 0;
  const rotationOffset = 90 - heroBaseAngle;
  const angles: Record<string, number> = {};
  for (const pos of positions) {
    const base = (baseAngles as Record<string, number>)[pos] || 0;
    angles[pos] = (base + rotationOffset + 360) % 360;
  }

  const W = format === '6max' ? 360 : 400;
  const H = format === '6max' ? 215 : 235;
  const containerW = W * 2 + 180;
  const containerH = H * 2 + 170;

  // Stadium border-radius = half of element height → flat top/bottom, rounded left/right
  const br = (h: number) => h / 2;

  // 폴드한 포지션 (전체 히스토리에서)
  const foldedPositions = new Set(
    actions.filter((a) => a.action === 'fold').map((a) => a.position)
  );

  // 현재 스트릿의 베팅만 표시 (이전 스트릿 칩은 팟으로 들어감)
  const betByPosition = new Map<string, number>();

  if (street === 'preflop') {
    // 프리플랍: 블라인드 기본 표시
    if (!foldedPositions.has('SB')) betByPosition.set('SB', 0.5);
    if (!foldedPositions.has('BB')) betByPosition.set('BB', 1);
  }

  // 현재 스트릿 액션만 필터하여 칩 표시
  for (const action of actions) {
    // street 태그가 없는 옛 액션은 preflop으로 간주
    const actionStreet = action.street || 'preflop';
    if (actionStreet !== street) continue;

    if (action.action === 'fold') {
      betByPosition.delete(action.position);
    } else if (action.amount && action.amount > 0) {
      betByPosition.set(action.position, action.amount);
    }
  }

  // 벳 칩 위치: 시트보다 테이블 안쪽 (시트와 센터 사이)
  const betHalfW = W * 0.68;
  const betHalfH = H * 0.68;

  return (
    <div className="relative mx-auto" style={{ width: containerW, height: containerH }}>

      {/* ── Layer 1: Table shadow on the "floor" ── */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: W * 2 + 30,
          height: H * 2 + 30,
          borderRadius: br(H * 2 + 30),
          background: 'rgba(0,0,0,0.35)',
          filter: 'blur(20px)',
        }}
      />

      {/* ── Layer 2: Wood rail (outer) ── */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: W * 2 + 24,
          height: H * 2 + 24,
          borderRadius: br(H * 2 + 24),
          background: `
            radial-gradient(ellipse at 30% 20%, #8b6914 0%, #6b4f10 30%, #4a3510 70%, #3a2808 100%)
          `,
          boxShadow: `
            inset 0 2px 4px rgba(255,255,255,0.1),
            inset 0 -3px 6px rgba(0,0,0,0.4),
            0 4px 20px rgba(0,0,0,0.5)
          `,
        }}
      />

      {/* ── Layer 3: Padded rail (inner cushion) ── */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: W * 2 + 6,
          height: H * 2 + 6,
          borderRadius: br(H * 2 + 6),
          background: `
            radial-gradient(ellipse at 40% 25%, #5c3d1e 0%, #4a2e14 50%, #3a200c 100%)
          `,
          boxShadow: `
            inset 0 3px 8px rgba(0,0,0,0.6),
            inset 0 -1px 2px rgba(255,255,255,0.05)
          `,
        }}
      />

      {/* ── Layer 4: Felt surface ── */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden"
        style={{
          width: W * 2 - 14,
          height: H * 2 - 14,
          borderRadius: br(H * 2 - 14),
          background: `
            radial-gradient(ellipse at 45% 35%, #22994d 0%, #1a7f3e 25%, #147034 50%, #0e5a28 75%, #094a1f 100%)
          `,
          boxShadow: `
            inset 0 0 80px rgba(0,0,0,0.25),
            inset 0 4px 16px rgba(0,0,0,0.15)
          `,
        }}
      >
        {/* Felt texture overlay (noise-like) */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg,   transparent, transparent 2px, rgba(255,255,255,0.5) 2px, transparent 3px),
              repeating-linear-gradient(90deg,  transparent, transparent 2px, rgba(255,255,255,0.5) 2px, transparent 3px)
            `,
          }}
        />

        {/* Subtle highlight on felt (light source from top-left) */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            background: 'radial-gradient(ellipse at 35% 25%, rgba(255,255,255,0.6), transparent 60%)',
          }}
        />

        {/* Inner betting line */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: W * 2 - 80,
            height: H * 2 - 80,
            borderRadius: br(H * 2 - 80),
            border: '1.5px solid rgba(255,255,255,0.06)',
          }}
        />

        {/* Community cards & pot — centered */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2.5">
          <CommunityCards cards={communityCards} />
          <PotDisplay pot={pot} />
        </div>
      </div>

      {/* ── Bet Chips ── */}
      {positions.map((pos) => {
        const betAmount = betByPosition.get(pos);
        if (!betAmount || foldedPositions.has(pos)) return null;
        const { x, y } = stadiumPoint(angles[pos] || 0, betHalfW, betHalfH);
        return (
          <BetChip
            key={`bet-${pos}`}
            amount={betAmount}
            x={x}
            y={y}
            isHero={pos === heroPosition}
            isVillain={pos === villainPosition}
          />
        );
      })}

      {/* ── Seats ── */}
      {positions.map((pos) => (
        <Seat
          key={pos}
          position={pos}
          isHero={pos === heroPosition}
          isVillain={pos === villainPosition}
          isActive={!foldedPositions.has(pos)}
          hasFolded={foldedPositions.has(pos)}
          angle={angles[pos] || 0}
          tableWidth={W}
          tableHeight={H}
        />
      ))}
    </div>
  );
}
