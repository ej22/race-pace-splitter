import React, { useState } from 'react';

const MILES_TO_KM = 1.60934;

const PRESETS = [
  { label: '5K', distanceKm: 5 },
  { label: '10K', distanceKm: 10 },
  { label: 'Half', distanceKm: 21.0975 },
  { label: 'Marathon', distanceKm: 42.195 },
];

export default function RaceSelector({ selectedRace, onChange }) {
  const [customVal, setCustomVal] = useState('');
  const [unit, setUnit] = useState('km');

  function selectPreset(preset) {
    onChange({ distanceKm: preset.distanceKm, unit: 'km', label: preset.label });
    setCustomVal('');
  }

  function handleUnitToggle(newUnit) {
    if (newUnit === unit) return;
    if (customVal !== '') {
      const parsed = parseFloat(customVal);
      if (!isNaN(parsed)) {
        const converted = newUnit === 'mile'
          ? (parsed / MILES_TO_KM).toFixed(2)
          : (parsed * MILES_TO_KM).toFixed(2);
        setCustomVal(converted);
      }
    }
    setUnit(newUnit);
  }

  function handleCustomInput(e) {
    const val = e.target.value;
    setCustomVal(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      const distanceKm = unit === 'mile' ? parsed * MILES_TO_KM : parsed;
      onChange({ distanceKm, unit, label: `${val} ${unit === 'mile' ? 'mi' : 'km'}` });
    } else {
      onChange(null);
    }
  }

  const activePresetLabel = selectedRace?.label;

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-bold tracking-widest text-neutral-500 uppercase">Race Distance</h2>
      <div className="flex gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => selectPreset(p)}
            className={`flex-1 py-2 px-3 text-sm font-bold tracking-wide border transition-colors ${
              activePresetLabel === p.label
                ? 'bg-[#F27E00] border-[#F27E00] text-black'
                : 'bg-transparent border-neutral-700 text-neutral-300 hover:border-[#F27E00] hover:text-[#F27E00]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 items-center">
        <input
          type="number"
          min="0.1"
          step="0.01"
          placeholder="Custom distance"
          value={customVal}
          onChange={handleCustomInput}
          className="flex-1 bg-neutral-900 border border-neutral-700 text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:border-[#F27E00]"
        />
        <div className="flex border border-neutral-700">
          {['km', 'mile'].map((u) => (
            <button
              key={u}
              onClick={() => handleUnitToggle(u)}
              className={`px-3 py-2 text-sm font-bold transition-colors ${
                unit === u
                  ? 'bg-[#F27E00] text-black'
                  : 'bg-neutral-900 text-neutral-400 hover:text-[#F27E00]'
              }`}
            >
              {u === 'mile' ? 'mi' : 'km'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
