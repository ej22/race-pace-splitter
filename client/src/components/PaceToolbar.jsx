import React, { useState } from 'react';
import { parsePaceInput } from '../utils/paceCalc';

const MIN_SECONDS = 5;
const DEFAULT_SECONDS = 300; // 5:00

function secondsToMmss(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function parseOrDefault(val) {
  const parsed = parsePaceInput(val);
  return parsed != null ? parsed : null;
}

export default function PaceToolbar({ paceUnit, totalSegments, onChange }) {
  const [inputVal, setInputVal] = useState('');

  function adjust(delta) {
    const current = parseOrDefault(inputVal);
    const base = current != null ? current : DEFAULT_SECONDS;
    const next = Math.max(MIN_SECONDS, base + delta);
    setInputVal(secondsToMmss(next));
  }

  function handleApply() {
    const parsed = parseOrDefault(inputVal);
    if (parsed == null) return;
    const mmss = secondsToMmss(parsed);
    onChange(Array.from({ length: totalSegments }, () => mmss));
  }

  const isValid = inputVal === '' || parsePaceInput(inputVal) != null;

  return (
    <div className="mb-4 pb-3 border-b border-neutral-800">
      <p className="text-xs font-bold tracking-widest text-neutral-500 uppercase mb-2">
        Set pace for all segments
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => adjust(-5)}
          className="w-9 h-9 flex items-center justify-center bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs font-mono hover:border-[#F27E00] hover:text-[#F27E00] transition-colors"
          title="Subtract 5 seconds"
        >
          −5
        </button>

        <div className="flex items-center gap-1">
          <input
            type="text"
            placeholder="5:00"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className={`w-20 bg-neutral-900 border text-right font-pace text-sm px-2 py-1 focus:outline-none focus:border-[#F27E00] ${
              !isValid
                ? 'border-red-500 text-red-400'
                : 'border-neutral-700 text-neutral-200'
            }`}
          />
          <span className="text-neutral-500 text-xs font-mono">{paceUnit}</span>
        </div>

        <button
          onClick={() => adjust(5)}
          className="w-9 h-9 flex items-center justify-center bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs font-mono hover:border-[#F27E00] hover:text-[#F27E00] transition-colors"
          title="Add 5 seconds"
        >
          +5
        </button>

        <button
          onClick={handleApply}
          disabled={!inputVal || !isValid}
          className="px-3 h-9 bg-[#F27E00] text-white text-xs font-bold tracking-widest uppercase hover:bg-[#d96e00] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Apply to All
        </button>
      </div>
    </div>
  );
}
