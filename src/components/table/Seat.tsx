import type { Position } from '../../types/game';
import { POSITION_LABELS } from '../../constants/positions';

interface SeatProps {
  position: Position;
  isHero: boolean;
  isVillain: boolean;
  isActive: boolean;
  hasFolded: boolean;
  angle: number;
  tableWidth: number;
  tableHeight: number;
}

/** Find the point where a ray from the origin at `angleDeg` intersects a stadium boundary. */
function stadiumPoint(angleDeg: number, halfW: number, halfH: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);

  const c = halfW - halfH; // half-length of the straight (flat) sections
  const r = halfH;         // radius of the semicircular end-caps

  let minT = Infinity;
  let px = 0;
  let py = 0;

  // Top flat edge: y = -r, valid for |x| <= c
  if (dy < -1e-6) {
    const t = -r / dy;
    const ix = dx * t;
    if (Math.abs(ix) <= c && t < minT) {
      minT = t; px = ix; py = -r;
    }
  }

  // Bottom flat edge: y = r, valid for |x| <= c
  if (dy > 1e-6) {
    const t = r / dy;
    const ix = dx * t;
    if (Math.abs(ix) <= c && t < minT) {
      minT = t; px = ix; py = r;
    }
  }

  // Semicircle intersection helper
  const solveCircle = (cx: number, side: 'right' | 'left') => {
    const ox = -cx;
    const b = 2 * dx * ox;
    const det = b * b - 4 * (ox * ox - r * r);
    if (det < 0) return;
    const sq = Math.sqrt(det);
    for (const t of [(-b + sq) / 2, (-b - sq) / 2]) {
      if (t > 1e-3 && t < minT) {
        const ix = dx * t;
        if ((side === 'right' && ix >= c) || (side === 'left' && ix <= -c)) {
          minT = t; px = ix; py = dy * t;
        }
      }
    }
  };

  solveCircle(c, 'right');
  solveCircle(-c, 'left');

  return { x: px, y: py };
}

export default function Seat({
  position,
  isHero,
  isVillain,
  hasFolded,
  angle,
  tableWidth,
  tableHeight,
}: SeatProps) {
  // Seat orbit: slightly outside the wood rail
  const seatHalfW = tableWidth + 52;
  const seatHalfH = tableHeight + 47;
  const { x, y } = stadiumPoint(angle, seatHalfW, seatHalfH);

  const label = POSITION_LABELS[position] || position;

  // Color scheme
  let ringColor = '#4b5563';  // gray
  let bgFrom = '#374151';
  let bgTo = '#1f2937';
  let labelColor = '#d1d5db';
  let subColor = '#9ca3af';

  if (isHero) {
    ringColor = '#3b82f6';
    bgFrom = '#1e3a8a';
    bgTo = '#1e40af';
    labelColor = '#bfdbfe';
    subColor = '#93c5fd';
  } else if (isVillain) {
    ringColor = '#ef4444';
    bgFrom = '#7f1d1d';
    bgTo = '#991b1b';
    labelColor = '#fecaca';
    subColor = '#fca5a5';
  }

  if (hasFolded) {
    ringColor = '#374151';
    bgFrom = '#1f2937';
    bgTo = '#111827';
    labelColor = '#6b7280';
    subColor = '#4b5563';
  }

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
      }}
    >
      {/* Seat chip-like circle */}
      <div
        className="relative flex flex-col items-center justify-center rounded-full transition-all duration-300"
        style={{
          width: 56,
          height: 56,
          background: `linear-gradient(145deg, ${bgFrom}, ${bgTo})`,
          border: `2.5px solid ${ringColor}`,
          boxShadow: hasFolded
            ? '0 2px 8px rgba(0,0,0,0.3)'
            : `0 2px 12px rgba(0,0,0,0.4), 0 0 16px ${ringColor}30`,
        }}
      >
        <span
          className="font-extrabold leading-none"
          style={{ fontSize: 13, color: labelColor }}
        >
          {label}
        </span>
        {isHero && !hasFolded && (
          <span className="leading-none mt-0.5" style={{ fontSize: 8, color: subColor, letterSpacing: '0.05em' }}>
            YOU
          </span>
        )}
        {hasFolded && (
          <span className="leading-none mt-0.5" style={{ fontSize: 8, color: subColor }}>
            FOLD
          </span>
        )}
      </div>

      {/* Dealer button indicator for BTN */}
      {position === 'BTN' && !hasFolded && (
        <div
          className="absolute -top-1 -right-1 rounded-full flex items-center justify-center"
          style={{
            width: 18,
            height: 18,
            background: 'linear-gradient(135deg, #fef3c7, #fbbf24)',
            border: '1.5px solid #f59e0b',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            fontSize: 8,
            fontWeight: 800,
            color: '#78350f',
          }}
        >
          D
        </div>
      )}
    </div>
  );
}
