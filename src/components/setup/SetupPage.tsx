import { useNavigate } from 'react-router-dom';
import { useSetupStore } from '../../store/setupStore';
import { useStatsStore } from '../../store/statsStore';
import { POSITIONS_6MAX, POSITIONS_9MAX, POSITION_LABELS } from '../../constants/positions';
import { STRINGS } from '../../constants/strings';
import { formatPercent } from '../../utils/format';
import type { GameMode, GameFormat, Position, ScenarioType } from '../../types/game';

/* ────────────────────────────────────────────
   Reusable primitives
   ──────────────────────────────────────────── */

function Chip({
  selected,
  onClick,
  children,
  accent = 'blue',
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  accent?: 'blue' | 'purple' | 'teal';
}) {
  const base =
    'relative px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 cursor-pointer select-none ' +
    'border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ';

  const colors = {
    blue: 'bg-blue-600 text-white border-blue-500 shadow-[0_0_14px_rgba(59,130,246,0.3)]',
    purple: 'bg-purple-600 text-white border-purple-500 shadow-[0_0_14px_rgba(147,51,234,0.3)]',
    teal: 'bg-teal-600 text-white border-teal-500 shadow-[0_0_14px_rgba(20,184,166,0.3)]',
  };

  const inactive =
    'bg-white/[0.04] text-gray-300 border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12]';

  return (
    <button onClick={onClick} className={base + (selected ? colors[accent] : inactive)}>
      {children}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[12px] font-semibold text-gray-500 tracking-wider uppercase mb-3">
      {children}
    </label>
  );
}

function Divider() {
  return <div className="h-px bg-white/[0.05] my-1" />;
}

/* ────────────────────────────────────────────
   Page
   ──────────────────────────────────────────── */

export default function SetupPage() {
  const navigate = useNavigate();
  const setup = useSetupStore();
  const stats = useStatsStore();

  const positions = setup.format === '6max' ? POSITIONS_6MAX : POSITIONS_9MAX;
  const cashStacks = [50, 75, 100, 150, 200];
  const tourneyStacks = [10, 15, 20, 25, 30, 40, 50];
  const stacks = setup.mode === 'cash' ? cashStacks : tourneyStacks;

  return (
    <div className="min-h-screen bg-[#0c0d1a] flex flex-col items-center px-4 py-16 relative overflow-hidden">
      {/* ── Background ambience ── */}
      <div
        className="pointer-events-none fixed top-[-40%] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-[0.06]"
        style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }}
      />
      <div
        className="pointer-events-none fixed bottom-[-30%] right-[-10%] w-[700px] h-[700px] rounded-full opacity-[0.04]"
        style={{ background: 'radial-gradient(circle, #22c55e, transparent 70%)' }}
      />

      {/* ===== Header ===== */}
      <header className="text-center mb-14 animate-fade-in relative z-10">
        {/* Decorative cards */}
        <div className="flex justify-center gap-2.5 mb-6">
          {['A♠', 'K♥'].map((card, i) => (
            <div
              key={card}
              className="w-[50px] h-[72px] rounded-lg flex flex-col items-center justify-center font-bold shadow-xl"
              style={{
                background: 'linear-gradient(145deg, #ffffff 0%, #ececdf 100%)',
                color: i === 1 ? '#dc2626' : '#1a1a2e',
                transform: `rotate(${i === 0 ? -10 : 10}deg)`,
                border: '1.5px solid rgba(0,0,0,0.06)',
                boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
              }}
            >
              <span className="text-[22px] leading-none">{card[0]}</span>
              <span className="text-[18px] leading-none mt-[-1px]">{card.slice(1)}</span>
            </div>
          ))}
        </div>

        <h1 className="text-5xl font-extrabold text-white tracking-tight">
          GTO<span className="text-blue-400">ex</span>
        </h1>
        <p className="text-gray-500 mt-3 text-[15px] font-medium">{STRINGS.appSubtitle}</p>
      </header>

      {/* ===== Main panel ===== */}
      <div
        className="relative z-10 w-full max-w-[540px] rounded-3xl p-[1px] animate-slide-up"
        style={{
          background: 'linear-gradient(160deg, rgba(255,255,255,0.09), rgba(255,255,255,0.02) 50%)',
        }}
      >
        <div
          className="rounded-3xl px-8 pt-9 pb-10 space-y-8"
          style={{ background: 'rgba(14, 15, 32, 0.92)' }}
        >
          {/* ── Title row ── */}
          <div className="flex items-center justify-between">
            <h2 className="text-[17px] font-bold text-white tracking-tight">{STRINGS.setupTitle}</h2>
            <button
              onClick={() => setup.randomize()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-semibold
                         bg-white/[0.04] text-gray-400 border border-white/[0.06]
                         hover:bg-white/[0.09] hover:text-gray-200 hover:border-white/[0.12] transition-all"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="1" width="22" height="22" rx="4" />
                <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                <circle cx="16" cy="8" r="1.5" fill="currentColor" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                <circle cx="8" cy="16" r="1.5" fill="currentColor" />
                <circle cx="16" cy="16" r="1.5" fill="currentColor" />
              </svg>
              {STRINGS.randomSetup}
            </button>
          </div>

          {/* ── Game mode ── */}
          <div>
            <SectionLabel>{STRINGS.modeLabel}</SectionLabel>
            <div className="grid grid-cols-2 gap-2.5">
              {([
                { value: 'cash' as GameMode, label: STRINGS.modeCash },
                { value: 'tournament' as GameMode, label: STRINGS.modeTournament },
              ]).map(({ value, label }) => (
                <Chip key={value} selected={setup.mode === value} onClick={() => setup.setMode(value)} accent="teal">
                  {label}
                </Chip>
              ))}
            </div>
          </div>

          <Divider />

          {/* ── Table format ── */}
          <div>
            <SectionLabel>{STRINGS.formatLabel}</SectionLabel>
            <div className="grid grid-cols-2 gap-2.5">
              {(['6max', '9max'] as GameFormat[]).map((f) => (
                <Chip key={f} selected={setup.format === f} onClick={() => setup.setFormat(f)}>
                  {f === '6max' ? STRINGS.format6Max : STRINGS.format9Max}
                </Chip>
              ))}
            </div>
          </div>

          {/* ── Stack size ── */}
          <div>
            <SectionLabel>
              {STRINGS.stackLabel}
              <span className="ml-2 text-white font-bold normal-case text-[13px]">{setup.stackSize}BB</span>
            </SectionLabel>
            <div className="flex flex-wrap gap-2">
              {stacks.map((s) => (
                <Chip key={s} selected={setup.stackSize === s} onClick={() => setup.setStackSize(s)}>
                  {s}
                </Chip>
              ))}
            </div>
          </div>

          {/* ── Ante (tournament only) ── */}
          {setup.mode === 'tournament' && (
            <div>
              <SectionLabel>{STRINGS.anteLabel}</SectionLabel>
              <div className="flex flex-wrap gap-2">
                {[0, 0.1, 0.125, 0.15, 0.2, 0.25].map((a) => (
                  <Chip key={a} selected={setup.ante === a} onClick={() => setup.setAnte(a)} accent="teal">
                    {a === 0 ? '없음' : `${a}BB`}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          <Divider />

          {/* ── Hero position ── */}
          <div>
            <SectionLabel>{STRINGS.positionLabel}</SectionLabel>
            <div className="flex flex-wrap gap-2">
              <Chip
                selected={setup.heroPosition === 'random'}
                onClick={() => setup.setHeroPosition('random')}
                accent="purple"
              >
                {STRINGS.randomPosition}
              </Chip>
              {positions.map((pos) => (
                <Chip
                  key={pos}
                  selected={setup.heroPosition === pos}
                  onClick={() => setup.setHeroPosition(pos as Position)}
                >
                  {POSITION_LABELS[pos]}
                </Chip>
              ))}
            </div>
          </div>

          {/* ── Scenario ── */}
          <div>
            <SectionLabel>{STRINGS.scenarioLabel}</SectionLabel>
            <div className="grid grid-cols-2 gap-2.5">
              {([
                { value: 'RFI' as ScenarioType, label: STRINGS.scenarioRFI },
                { value: 'vsRFI' as ScenarioType, label: STRINGS.scenarioVsRFI },
                { value: 'vs3Bet' as ScenarioType, label: STRINGS.scenarioVs3Bet },
                { value: 'all' as ScenarioType, label: STRINGS.scenarioAll },
              ]).map(({ value, label }) => (
                <Chip key={value} selected={setup.scenario === value} onClick={() => setup.setScenario(value)}>
                  {label}
                </Chip>
              ))}
            </div>
          </div>

          {/* ── Divider before start ── */}
          <div className="pt-2">
            <div className="h-px bg-white/[0.05]" />
          </div>

          {/* ── Start button ── */}
          <button
            onClick={() => navigate('/play')}
            className="group relative w-full overflow-hidden rounded-2xl transition-all duration-200
                       hover:-translate-y-0.5 hover:scale-[1.01] active:translate-y-0 active:scale-100"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 group-hover:from-emerald-400 group-hover:via-green-400 group-hover:to-emerald-500 transition-all duration-300" />
            <div className="absolute inset-x-0 top-0 h-1/2 opacity-[0.15]" style={{ background: 'linear-gradient(to bottom, white, transparent)' }} />
            <div className="absolute -inset-2 opacity-0 group-hover:opacity-100 transition-opacity duration-400 blur-xl -z-10" style={{ background: 'rgba(34,197,94,0.3)' }} />
            <div className="relative flex items-center justify-center gap-2.5 py-4">
              <span className="text-white font-bold text-[17px] tracking-wide drop-shadow-sm">
                {STRINGS.startGame}
              </span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 group-hover:translate-x-1 transition-transform">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
            <div className="absolute bottom-0 inset-x-0 h-[3px] bg-emerald-800/60" />
          </button>
        </div>
      </div>

      {/* ===== Session stats ===== */}
      {stats.totalHands > 0 && (
        <div
          className="relative z-10 w-full max-w-[540px] mt-8 rounded-3xl p-[1px] animate-slide-up"
          style={{
            background: 'linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01) 50%)',
            animationDelay: '80ms',
          }}
        >
          <div className="rounded-3xl px-8 py-7" style={{ background: 'rgba(14, 15, 32, 0.88)' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[15px] font-bold text-white">{STRINGS.sessionStats}</h3>
              <button
                onClick={() => stats.reset()}
                className="text-[11px] text-red-400/60 hover:text-red-300 transition-colors font-medium"
              >
                {STRINGS.resetStats}
              </button>
            </div>

            {/* Main stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { value: stats.totalHands, label: STRINGS.totalHands, color: 'text-white' },
                { value: formatPercent(stats.getAccuracy()), label: STRINGS.accuracy, color: 'text-emerald-400' },
                { value: stats.correctHands + stats.acceptableHands, label: '정답', color: 'text-amber-400' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="text-center rounded-2xl py-3.5 px-2"
                  style={{ background: 'rgba(255,255,255,0.025)' }}
                >
                  <div className={`text-2xl font-extrabold ${item.color}`}>{item.value}</div>
                  <div className="text-[11px] text-gray-500 font-medium mt-1">{item.label}</div>
                </div>
              ))}
            </div>

            {/* By street */}
            <div className="grid grid-cols-4 gap-2.5">
              {['preflop', 'flop', 'turn', 'river'].map((street) => {
                const data = stats.byStreet[street];
                const pct = data ? data.correct / data.total : 0;
                const hasData = !!data;
                return (
                  <div
                    key={street}
                    className="text-center rounded-xl py-3 px-1"
                    style={{ background: 'rgba(255,255,255,0.025)' }}
                  >
                    <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1.5">
                      {street}
                    </div>
                    <div className={`text-sm font-bold ${hasData ? 'text-white' : 'text-gray-600'}`}>
                      {hasData ? formatPercent(pct) : '-'}
                    </div>
                    {hasData && (
                      <div className="mt-2 mx-auto h-1 rounded-full overflow-hidden bg-white/[0.06]" style={{ width: '80%' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct * 100}%`,
                            background: pct >= 0.7 ? '#22c55e' : pct >= 0.4 ? '#eab308' : '#ef4444',
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="relative z-10 mt-14 text-gray-600 text-[11px] tracking-wide">
        GTO 전략을 연습하고 실력을 향상시키세요
      </footer>
    </div>
  );
}
