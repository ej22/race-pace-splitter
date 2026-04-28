import React from 'react';
import { formatTime } from '../utils/paceCalc';

export default function SplitSlider({ splitMode, splitPercent, onChange, segments, goalSeconds }) {
  if (splitMode !== 'positive' && splitMode !== 'negative') return null;

  const projectedTime = segments.length > 0
    ? segments[segments.length - 1].cumulativeSeconds
    : null;
  const delta = projectedTime != null && goalSeconds ? projectedTime - goalSeconds : null;

  const directionLabel = splitMode === 'negative'
    ? `First km ${splitPercent}% slower than last km`
    : `First km ${splitPercent}% faster than last km`;

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-bold tracking-widest text-neutral-500 uppercase">Split Differential</h2>
      <p className="text-sm text-neutral-400">{directionLabel}</p>
      <input
        type="range"
        min={1}
        max={15}
        step={1}
        value={splitPercent}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#F27E00]"
      />
      <div className="flex justify-between text-xs text-neutral-600">
        <span>1%</span><span>15%</span>
      </div>
      {projectedTime != null && (
        <div className="text-sm">
          <span className="text-neutral-400">Projected: </span>
          <span className="font-pace text-neutral-100">{formatTime(projectedTime)}</span>
          {delta != null && (
            <span className={`ml-3 font-pace font-bold ${delta > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {delta > 0 ? '+' : ''}{formatTime(Math.abs(delta))}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
