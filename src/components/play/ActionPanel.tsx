import type { ScenarioType } from '../../types/game';
import { formatBB } from '../../utils/format';

interface ActionPanelProps {
  onAction: (action: 'fold' | 'call' | 'raise') => void;
  currentBet: number;
  pot: number;
  isDisabled: boolean;
  isPreflop: boolean;
  scenario: ScenarioType | string;
  heroPosition: string;
}

export default function ActionPanel({
  onAction,
  currentBet,
  pot,
  isDisabled,
  isPreflop,
  scenario,
}: ActionPanelProps) {
  const isRFI = scenario === 'RFI';
  const facingBet = !isRFI && currentBet > 0;

  // 시나리오별 라벨 결정
  const getCallLabel = (): string => {
    if (isRFI) {
      // RFI에서는 첫 액션 → 체크/림프
      return isPreflop ? '림프' : '체크';
    }
    if (!isPreflop && currentBet <= 0) return '체크';
    return '콜';
  };

  const getRaiseLabel = (): string => {
    if (!isPreflop) {
      if (currentBet > 0) {
        const raiseSize = Math.round(currentBet * 2.75 * 10) / 10;
        return `레이즈 ${formatBB(raiseSize)}`;
      }
      const betSize = Math.round(pot * 0.66 * 10) / 10;
      return `벳 ${formatBB(betSize)}`;
    }
    if (isRFI) return '오픈';
    if (scenario === 'vsRFI') return '3벳';
    if (scenario === 'vs3Bet') return '4벳';
    return '레이즈';
  };

  // 포스트플랍에서 폴드 비활성화 조건: 벳에 직면하지 않은 경우
  const isFoldDisabled = !isPreflop && currentBet <= 0;

  const callAmountText = facingBet && currentBet > 0 ? formatBB(currentBet) : null;

  const buttons = [
    {
      key: 'fold' as const,
      label: '폴드',
      shortcut: 'F',
      gradient: 'from-[#dc3545] to-[#a71d2a]',
      hoverGradient: 'from-[#e35d6a] to-[#c82333]',
      glowColor: 'rgba(220, 53, 69, 0.4)',
      bottomBorder: 'bg-[#6d1520]',
      subLabel: null as string | null,
      subColor: 'text-red-200/50',
    },
    {
      key: 'call' as const,
      label: getCallLabel(),
      shortcut: 'C',
      gradient: 'from-[#28a745] to-[#19692c]',
      hoverGradient: 'from-[#48c764] to-[#218838]',
      glowColor: 'rgba(40, 167, 69, 0.4)',
      bottomBorder: 'bg-[#145523]',
      subLabel: callAmountText,
      subColor: 'text-emerald-100/80',
    },
    {
      key: 'raise' as const,
      label: getRaiseLabel(),
      shortcut: 'R',
      gradient: 'from-[#f0ad4e] to-[#c77c14]',
      hoverGradient: 'from-[#f4c274] to-[#e09422]',
      glowColor: 'rgba(240, 173, 78, 0.4)',
      bottomBorder: 'bg-[#8a5a0e]',
      subLabel: null,
      subColor: 'text-amber-200/50',
    },
  ];

  return (
    <div className="flex gap-3 justify-center items-end animate-slide-up select-none">
      {buttons.map((btn) => (
        <button
          key={btn.key}
          onClick={() => onAction(btn.key)}
          disabled={isDisabled || (btn.key === 'fold' && isFoldDisabled)}
          className="group relative overflow-hidden rounded-2xl transition-all duration-200 ease-out
                     disabled:opacity-30 disabled:cursor-not-allowed disabled:saturate-0
                     hover:-translate-y-1.5 hover:scale-[1.03] active:translate-y-0 active:scale-100
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          style={{ minWidth: 110 }}
        >
          {/* Background gradient */}
          <div
            className={`absolute inset-0 bg-gradient-to-b ${btn.gradient} transition-all duration-200`}
          />
          {/* Hover gradient overlay */}
          <div
            className={`absolute inset-0 bg-gradient-to-b ${btn.hoverGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
          />
          {/* Top highlight (glass effect) */}
          <div
            className="absolute inset-x-0 top-0 h-[45%] opacity-[0.12] group-hover:opacity-[0.18] transition-opacity"
            style={{ background: 'linear-gradient(to bottom, white, transparent)' }}
          />
          {/* Hover glow */}
          <div
            className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg -z-10"
            style={{ background: btn.glowColor }}
          />

          {/* Content */}
          <div className="relative px-5 py-4 flex flex-col items-center gap-0.5">
            <span className="text-white font-bold text-[15px] tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
              {btn.label}
            </span>
            {btn.subLabel ? (
              <span className={`${btn.subColor} text-[11px] font-semibold`}>
                {btn.subLabel}
              </span>
            ) : (
              <span className={`${btn.subColor} text-[10px] font-mono tracking-[0.2em]`}>
                {btn.shortcut}
              </span>
            )}
          </div>

          {/* Bottom edge (3D depth) */}
          <div className={`absolute bottom-0 inset-x-0 h-[3px] ${btn.bottomBorder}`} />
        </button>
      ))}
    </div>
  );
}
