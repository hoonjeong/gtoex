import type { PlayerAction, Position, ScenarioType, Street } from '../../types/game';
import { POSITION_LABELS } from '../../constants/positions';
import { formatBB } from '../../utils/format';

interface ActionContextProps {
  scenario: ScenarioType;
  street: Street;
  heroPosition: Position;
  villainPosition: Position | null;
  actions: PlayerAction[];
  currentBet: number;
}

/**
 * 현재 상황을 명확하게 보여주는 액션 컨텍스트 배너
 * - 누가 먼저 액션했는지
 * - 히어로가 무엇에 직면하고 있는지
 */
export default function ActionContext({
  scenario,
  street,
  heroPosition,
  villainPosition,
  actions,
  currentBet,
}: ActionContextProps) {
  const heroLabel = POSITION_LABELS[heroPosition] || heroPosition;
  const villainLabel = villainPosition ? (POSITION_LABELS[villainPosition] || villainPosition) : '';

  // 프리플랍 상황 설명
  if (street === 'preflop') {
    if (scenario === 'RFI') {
      // 앞에 폴드한 플레이어들 카운트
      const foldCount = actions.filter(a => a.action === 'fold').length;
      if (foldCount === 0) {
        return (
          <ContextBanner
            icon="1st"
            iconColor="bg-blue-500"
            text="첫 액션 — 오픈 레이즈 또는 폴드"
          />
        );
      }
      return (
        <ContextBanner
          icon="1st"
          iconColor="bg-blue-500"
          text={`${foldCount}명 폴드 → ${heroLabel} 첫 오픈 기회`}
        />
      );
    }

    if (scenario === 'vsRFI') {
      const raiseAction = actions.find(a => a.action === 'raise');
      if (raiseAction) {
        return (
          <ContextBanner
            icon="2nd"
            iconColor="bg-red-500"
            text={`${POSITION_LABELS[raiseAction.position] || raiseAction.position} ${formatBB(raiseAction.amount || 0)} 오픈 → ${heroLabel} 차례`}
            highlight={`콜 ${formatBB(raiseAction.amount || 0)} / 3벳 / 폴드`}
          />
        );
      }
    }

    if (scenario === 'vs3Bet') {
      const raises = actions.filter(a => a.action === 'raise');
      const heroRaise = raises.find(a => a.position === heroPosition);
      const villain3bet = raises.find(a => a.position === villainPosition);
      if (heroRaise && villain3bet) {
        return (
          <ContextBanner
            icon="3rd"
            iconColor="bg-amber-500"
            text={`${heroLabel} ${formatBB(heroRaise.amount || 0)} 오픈 → ${villainLabel} ${formatBB(villain3bet.amount || 0)} 3벳`}
            highlight={`콜 ${formatBB(villain3bet.amount || 0)} / 4벳 / 폴드`}
          />
        );
      }
    }
  }

  // 포스트플랍 상황 설명
  const streetName = street === 'flop' ? '플랍' : street === 'turn' ? '턴' : '리버';

  if (currentBet > 0) {
    return (
      <ContextBanner
        icon="BET"
        iconColor="bg-red-500"
        text={`[${streetName}] ${villainLabel || '상대'} ${formatBB(currentBet)} 벳`}
        highlight={`콜 ${formatBB(currentBet)} / 레이즈 / 폴드`}
      />
    );
  }

  return (
    <ContextBanner
      icon="CHK"
      iconColor="bg-green-600"
      text={`[${streetName}] 체크 가능 상황`}
      highlight="체크 / 벳"
    />
  );
}

function ContextBanner({
  icon,
  iconColor,
  text,
  highlight,
}: {
  icon: string;
  iconColor: string;
  text: string;
  highlight?: string;
}) {
  return (
    <div className="flex items-center justify-center gap-2 animate-fade-in">
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900/80 border border-gray-700/50 backdrop-blur-sm">
        <span
          className={`${iconColor} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none`}
        >
          {icon}
        </span>
        <span className="text-gray-300 text-sm font-medium">{text}</span>
        {highlight && (
          <>
            <span className="text-gray-600">|</span>
            <span className="text-yellow-400/90 text-xs font-medium">{highlight}</span>
          </>
        )}
      </div>
    </div>
  );
}
