import { formatBB } from '../../utils/format';

interface PotDisplayProps {
  pot: number;
}

export default function PotDisplay({ pot }: PotDisplayProps) {
  return (
    <div className="flex items-center justify-center animate-fade-in">
      <div
        className="flex items-center gap-2 rounded-full px-5 py-1.5"
        style={{
          background: 'linear-gradient(135deg, rgba(120,80,20,0.7), rgba(80,50,10,0.6))',
          border: '1px solid rgba(251,191,36,0.25)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Chip icon */}
        <div
          className="rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            width: 20,
            height: 20,
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            border: '2px dashed #92400e',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        />
        <span className="text-amber-200 font-bold text-[13px] tracking-wide">
          {formatBB(pot)}
        </span>
      </div>
    </div>
  );
}
