import React from 'react';
import { formatPace } from '../utils/paceCalc';

const MILES_TO_KM = 1.60934;

export default function GoalTimeInput({ goalTime, onChange, selectedRace }) {
  const { h, m, s } = goalTime || { h: '', m: '', s: '' };

  function update(field, val) {
    const cleaned = val.replace(/\D/g, '').slice(0, field === 'h' ? 2 : 2);
    onChange({ ...{ h: h || '', m: m || '', s: s || '' }, [field]: cleaned });
  }

  const totalSeconds = (() => {
    const hv = parseInt(h) || 0;
    const mv = parseInt(m) || 0;
    const sv = parseInt(s) || 0;
    if (hv === 0 && mv === 0 && sv === 0) return null;
    return hv * 3600 + mv * 60 + sv;
  })();

  const avgPaceKm = selectedRace && totalSeconds ? totalSeconds / selectedRace.distanceKm : null;
  const avgPaceMile = avgPaceKm ? avgPaceKm * MILES_TO_KM : null;

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-bold tracking-widest text-neutral-500 uppercase">Goal Time</h2>
      <div className="flex gap-2 items-end">
        {[
          { key: 'h', label: 'HRS', max: 99 },
          { key: 'm', label: 'MIN', max: 59 },
          { key: 's', label: 'SEC', max: 59 },
        ].map(({ key, label }) => (
          <div key={key} className="flex flex-col items-center gap-1">
            <label className="text-[10px] tracking-widest text-neutral-500">{label}</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={2}
              placeholder="00"
              value={key === 'h' ? h : key === 'm' ? m : s}
              onChange={(e) => update(key, e.target.value)}
              className="w-16 bg-neutral-900 border border-neutral-700 text-neutral-100 text-center font-pace text-xl py-2 focus:outline-none focus:border-[#F27E00]"
            />
          </div>
        ))}
      </div>

      {avgPaceKm && (
        <div className="text-sm text-neutral-400 space-x-4">
          <span>Avg: <span className="font-pace text-neutral-200">{formatPace(avgPaceKm)}/km</span></span>
          <span><span className="font-pace text-neutral-200">{formatPace(avgPaceMile)}/mi</span></span>
        </div>
      )}
    </div>
  );
}
