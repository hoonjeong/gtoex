import { useState } from 'react';

interface RaiseSliderProps {
  pot: number;
  minRaise: number;
  maxRaise: number;
  onRaise: (amount: number) => void;
}

export default function RaiseSlider({ pot, minRaise, maxRaise, onRaise }: RaiseSliderProps) {
  const [amount, setAmount] = useState(minRaise);

  const presets = [
    { label: '1/3 Pot', value: Math.round(pot / 3 * 10) / 10 },
    { label: '1/2 Pot', value: Math.round(pot / 2 * 10) / 10 },
    { label: '2/3 Pot', value: Math.round(pot * 2 / 3 * 10) / 10 },
    { label: 'Pot', value: Math.round(pot * 10) / 10 },
  ];

  return (
    <div className="bg-gray-800/80 rounded-lg p-3 w-64">
      <div className="flex justify-between text-xs text-gray-400 mb-2">
        <span>{minRaise.toFixed(1)}BB</span>
        <span className="text-white font-bold">{amount.toFixed(1)}BB</span>
        <span>{maxRaise.toFixed(1)}BB</span>
      </div>

      <input
        type="range"
        min={minRaise}
        max={maxRaise}
        step={0.5}
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
      />

      <div className="flex gap-1 mt-2">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => {
              const clamped = Math.max(minRaise, Math.min(maxRaise, p.value));
              setAmount(clamped);
            }}
            className="flex-1 py-1 text-[10px] bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => onRaise(amount)}
        className="w-full mt-2 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg text-sm transition-all"
      >
        레이즈 {amount.toFixed(1)}BB
      </button>
    </div>
  );
}
