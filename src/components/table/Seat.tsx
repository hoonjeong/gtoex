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
export function stadiumPoint(angleDeg: number, halfW: number, halfH: number): { x: number; y: number } {
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

  // ── Folded state: dimmed but label still readable ──
  if (hasFolded) {
    return (
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
        style={{
          left: `calc(50% + ${x}px)`,
          top: `calc(50% + ${y}px)`,
          opacity: 0.55,
        }}
      >
        <div
          className="relative flex flex-col items-center justify-center rounded-full"
          style={{
            width: 56,
            height: 56,
            background: 'linear-gradient(145deg, #1f2937, #111827)',
            border: '2px solid #4b5563',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        >
          <span
            className="font-extrabold leading-none"
            style={{ fontSize: 13, color: '#9ca3af', zIndex: 3 }}
          >
            {label}
          </span>
          <span
            className="leading-none mt-0.5"
            style={{ fontSize: 8, color: '#ef4444', fontWeight: 700, letterSpacing: '0.1em', zIndex: 3 }}
          >
            FOLD
          </span>
        </div>
        {/* 빨간 사선 — 시트 바깥 좌상→우하 */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 4 }}
        >
          <svg width="56" height="56" viewBox="0 0 56 56">
            <line x1="14" y1="14" x2="42" y2="42" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
          </svg>
        </div>
      </div>
    );
  }

  // ── Active state ──
  let ringColor = '#6b7280';
  let bgFrom = '#374151';
  let bgTo = '#1f2937';
  let labelColor = '#d1d5db';
  let subColor = '#9ca3af';
  let glowShadow = '';
  let statusDotColor = '#22c55e'; // green alive dot for everyone

  if (isHero) {
    ringColor = '#3b82f6';
    bgFrom = '#1e3a8a';
    bgTo = '#1e40af';
    labelColor = '#bfdbfe';
    subColor = '#93c5fd';
    glowShadow = '0 0 12px rgba(59,130,246,0.5), 0 0 24px rgba(59,130,246,0.2)';
    statusDotColor = '#3b82f6';
  } else if (isVillain) {
    ringColor = '#ef4444';
    bgFrom = '#7f1d1d';
    bgTo = '#991b1b';
    labelColor = '#fecaca';
    subColor = '#fca5a5';
    glowShadow = '0 0 12px rgba(239,68,68,0.5), 0 0 24px rgba(239,68,68,0.2)';
    statusDotColor = '#ef4444';
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
          boxShadow: glowShadow || `0 2px 12px rgba(0,0,0,0.4), 0 0 16px ${ringColor}30`,
        }}
      >
        <span
          className="font-extrabold leading-none"
          style={{ fontSize: 13, color: labelColor }}
        >
          {label}
        </span>
        {isHero && (
          <span className="leading-none mt-0.5" style={{ fontSize: 8, color: subColor, letterSpacing: '0.05em' }}>
            YOU
          </span>
        )}
        {isVillain && (
          <span className="leading-none mt-0.5" style={{ fontSize: 8, color: subColor, letterSpacing: '0.05em' }}>
            OPP
          </span>
        )}
      </div>

      {/* Alive indicator dot (bottom-right) */}
      <div
        className="absolute rounded-full"
        style={{
          width: 10,
          height: 10,
          bottom: 1,
          right: 1,
          background: statusDotColor,
          border: '2px solid #111827',
          boxShadow: `0 0 6px ${statusDotColor}80`,
        }}
      />

      {/* Dealer button indicator for BTN */}
      {position === 'BTN' && (
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
