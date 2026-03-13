import type { ActionFrequency } from '../../types/gto';

interface ActionFrequencyBarProps {
  frequencies: ActionFrequency;
  playerAction?: 'fold' | 'call' | 'raise';
}

export default function ActionFrequencyBar({ frequencies, playerAction }: ActionFrequencyBarProps) {
  const total = frequencies.fold + frequencies.call + frequencies.raise;
  if (total === 0) return null;

  const pct = (v: number) => Math.round((v / total) * 100);

  const segments = [
    { key: 'fold' as const, value: frequencies.fold, color: 'bg-red-500', label: '폴드' },
    { key: 'call' as const, value: frequencies.call, color: 'bg-green-500', label: '콜' },
    { key: 'raise' as const, value: frequencies.raise, color: 'bg-yellow-500', label: '레이즈' },
  ].filter((s) => s.value > 0);

  return (
    <div className="w-full">
      {/* Bar */}
      <div className="flex h-8 rounded-lg overflow-hidden shadow-inner bg-gray-700">
        {segments.map((seg) => (
          <div
            key={seg.key}
            className={`${seg.color} flex items-center justify-center text-xs font-bold text-white transition-all duration-500 relative`}
            style={{ width: `${pct(seg.value)}%` }}
          >
            {pct(seg.value) > 10 && `${pct(seg.value)}%`}
            {/* Highlight player's action */}
            {playerAction === seg.key && (
              <div className="absolute inset-0 border-2 border-white rounded-sm animate-pulse-once" />
            )}
          </div>
        ))}
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-1.5">
        {segments.map((seg) => (
          <div
            key={seg.key}
            className={`text-xs flex items-center gap-1 ${
              playerAction === seg.key ? 'text-white font-bold' : 'text-gray-400'
            }`}
          >
            <span className={`inline-block w-2.5 h-2.5 rounded-sm ${seg.color}`} />
            {seg.label} {pct(seg.value)}%
          </div>
        ))}
      </div>
    </div>
  );
}
