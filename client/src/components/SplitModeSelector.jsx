import React from 'react';

const MODES = [
  { value: 'even', label: 'Even' },
  { value: 'negative', label: 'Negative' },
  { value: 'positive', label: 'Positive' },
  { value: 'custom', label: 'Custom' },
];

export default function SplitModeSelector({ splitMode, onChange }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xs font-bold tracking-widest text-neutral-500 uppercase">Split Strategy</h2>
      <div className="flex border border-neutral-700">
        {MODES.map((mode) => (
          <button
            key={mode.value}
            onClick={() => onChange(mode.value)}
            className={`flex-1 py-2 text-sm font-bold tracking-wide transition-colors ${
              splitMode === mode.value
                ? 'bg-[#F27E00] text-black'
                : 'bg-transparent text-neutral-400 hover:text-[#F27E00]'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}
