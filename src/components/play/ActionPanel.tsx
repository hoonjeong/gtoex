import { useState } from 'react';
import type { ScenarioType } from '../../types/game';
import { formatBB } from '../../utils/format';

interface ActionPanelProps {
  onAction: (action: 'fold' | 'call' | 'raise', raiseSize?: number) => void;
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
  const [showSizing, setShowSizing] = useState(false);
  const [customSize, setCustomSize] = useState('');

  const isRFI = scenario === 'RFI';
  const facingBet = !isRFI && currentBet > 0;

  // 시나리오별 라벨 결정
  const getCallLabel = (): string => {
    if (isRFI) return isPreflop ? '림프' : '체크';
    if (!isPreflop && currentBet <= 0) return '체크';
    return '콜';
  };

  const getRaiseLabel = (): string => {
    if (!isPreflop) return currentBet > 0 ? '레이즈' : '벳';
    if (isRFI) return '오픈';
    if (scenario === 'vsRFI') return '3벳';
    if (scenario === 'vs3Bet') return '4벳';
    return '레이즈';
  };

  // 프리셋 사이즈 계산
  const getSizingPresets = (): { label: string; value: number }[] => {
    if (isPreflop) {
      if (isRFI) {
        return [
          { label: '2x', value: 2.0 },
          { label: '2.5x', value: 2.5 },
          { label: '3x', value: 3.0 },
          { label: '4x', value: 4.0 },
        ];
      }
      if (scenario === 'vsRFI') {
        // 3벳: 오픈 사이즈 * 3~4x
        return [
          { label: '3x', value: Math.round(currentBet * 3 * 10) / 10 },
          { label: '3.5x', value: Math.round(currentBet * 3.5 * 10) / 10 },
          { label: '4x', value: Math.round(currentBet * 4 * 10) / 10 },
        ];
      }
      if (scenario === 'vs3Bet') {
        // 4벳: 3벳 사이즈 * 2.2~2.5x
        return [
          { label: '2.2x', value: Math.round(currentBet * 2.2 * 10) / 10 },
          { label: '2.5x', value: Math.round(currentBet * 2.5 * 10) / 10 },
          { label: 'All-in', value: 100 },
        ];
      }
    }
    // 포스트플랍
    const effectivePot = pot + (currentBet > 0 ? currentBet : 0);
    if (currentBet > 0) {
      // 레이즈
      return [
        { label: '2.5x', value: Math.round(currentBet * 2.5 * 10) / 10 },
        { label: '3x', value: Math.round(currentBet * 3 * 10) / 10 },
        { label: 'Pot', value: Math.round(effectivePot * 10) / 10 },
      ];
    }
    // 벳
    return [
      { label: '1/3', value: Math.round(effectivePot / 3 * 10) / 10 },
      { label: '1/2', value: Math.round(effectivePot / 2 * 10) / 10 },
      { label: '2/3', value: Math.round(effectivePot * 2 / 3 * 10) / 10 },
      { label: 'Pot', value: Math.round(effectivePot * 10) / 10 },
    ];
  };

  const handleRaiseClick = () => {
    setShowSizing(true);
    setCustomSize('');
  };

  const handleSizeConfirm = (size: number) => {
    setShowSizing(false);
    onAction('raise', size);
  };

  const handleCustomSubmit = () => {
    const val = parseFloat(customSize);
    if (!isNaN(val) && val > 0) {
      handleSizeConfirm(Math.round(val * 10) / 10);
    }
  };

  const isFoldDisabled = !isPreflop && currentBet <= 0;
  const callAmountText = facingBet && currentBet > 0 ? formatBB(currentBet) : null;

  // 사이징 패널이 열려있을 때
  if (showSizing) {
    const presets = getSizingPresets();
    return (
      <div className="flex flex-col items-center gap-2 animate-fade-in select-none">
        <div className="text-gray-400 text-xs font-medium">{getRaiseLabel()} 사이즈 선택</div>
        <div className="flex gap-2 items-center">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => handleSizeConfirm(p.value)}
              className="group relative overflow-hidden rounded-xl transition-all duration-200 ease-out
                         hover:-translate-y-1 hover:scale-[1.03] active:translate-y-0 active:scale-100"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[#f0ad4e] to-[#c77c14] group-hover:from-[#f4c274] group-hover:to-[#e09422] transition-all" />
              <div className="absolute inset-x-0 top-0 h-[45%] opacity-[0.12]" style={{ background: 'linear-gradient(to bottom, white, transparent)' }} />
              <div className="relative px-4 py-3 flex flex-col items-center gap-0.5">
                <span className="text-white font-bold text-[14px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                  {p.label}
                </span>
                <span className="text-amber-100/80 text-[11px] font-semibold">
                  {formatBB(p.value)}
                </span>
              </div>
              <div className="absolute bottom-0 inset-x-0 h-[3px] bg-[#8a5a0e]" />
            </button>
          ))}

          {/* 직접 입력 */}
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.5"
              min="0.5"
              placeholder="BB"
              value={customSize}
              onChange={(e) => setCustomSize(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
              className="w-16 px-2 py-2.5 rounded-lg bg-gray-800 border border-gray-600 text-white text-center text-sm
                         focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50"
            />
            <button
              onClick={handleCustomSubmit}
              disabled={!customSize || isNaN(parseFloat(customSize))}
              className="px-3 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-30 disabled:cursor-not-allowed
                         text-white font-bold text-sm transition-all"
            >
              OK
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowSizing(false)}
          className="text-gray-500 hover:text-gray-300 text-xs transition-colors mt-1"
        >
          취소 (ESC)
        </button>
      </div>
    );
  }

  // 기본 액션 버튼
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
          onClick={() => {
            if (btn.key === 'raise') {
              handleRaiseClick();
            } else {
              onAction(btn.key);
            }
          }}
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
