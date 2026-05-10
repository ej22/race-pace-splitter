import React, { useState, useMemo } from 'react';
import {
  convertOutdoorToTreadmill,
  speedToPace,
  paceToSpeed,
  formatPace,
  generateRangeTable,
} from '../utils/treadmillCalc';

function parsePaceStr(str) {
  const parts = str.trim().split(':');
  if (parts.length !== 2) return null;
  const m = parseInt(parts[0], 10);
  const s = parseInt(parts[1], 10);
  if (isNaN(m) || isNaN(s) || s < 0 || s >= 60 || m < 0) return null;
  return paceToSpeed(m * 60 + s);
}

function parseSpeedStr(str) {
  const n = parseFloat(str);
  return isNaN(n) || n <= 0 ? null : n;
}

export default function TreadmillConverter() {
  const [inputMode, setInputMode] = useState('speed');
  const [minValue, setMinValue] = useState('10.0');
  const [maxValue, setMaxValue] = useState('12.0');

  const parseValue = (val) =>
    inputMode === 'speed' ? parseSpeedStr(val) : parsePaceStr(val);

  const minSpeed = parseValue(minValue);
  const maxSpeed = parseValue(maxValue);
  const valid = minSpeed != null && maxSpeed != null && minSpeed > 0 && maxSpeed > minSpeed;

  function switchMode(newMode) {
    if (newMode === inputMode) return;
    if (newMode === 'pace') {
      const s1 = parseSpeedStr(minValue);
      const s2 = parseSpeedStr(maxValue);
      if (s1) setMinValue(formatPace(speedToPace(s1)));
      if (s2) setMaxValue(formatPace(speedToPace(s2)));
    } else {
      const s1 = parsePaceStr(minValue);
      const s2 = parsePaceStr(maxValue);
      if (s1) setMinValue(s1.toFixed(1));
      if (s2) setMaxValue(s2.toFixed(1));
    }
    setInputMode(newMode);
  }

  const rows = useMemo(() => {
    if (!valid) return [];
    return generateRangeTable(minSpeed, maxSpeed, 0.5);
  }, [valid, minSpeed, maxSpeed]);

  const midSpeed = valid ? (minSpeed + maxSpeed) / 2 : null;
  const midTreadmillSpeed = midSpeed != null ? convertOutdoorToTreadmill(midSpeed) : null;
  const midRow = midSpeed != null ? {
    outdoorSpeed: midSpeed,
    outdoorPace: speedToPace(midSpeed),
    treadmillSpeed: midTreadmillSpeed,
    treadmillPace: speedToPace(midTreadmillSpeed),
  } : null;

  const closestMidIdx = useMemo(() => {
    if (!midSpeed || rows.length === 0) return -1;
    return rows.reduce((best, row, idx) =>
      Math.abs(row.outdoorSpeed - midSpeed) < Math.abs(rows[best].outdoorSpeed - midSpeed) ? idx : best
    , 0);
  }, [rows, midSpeed]);

  const summaryItems = valid && rows.length > 0 ? [
    { label: 'Slowest', row: rows[0] },
    { label: 'Average', row: midRow },
    { label: 'Fastest', row: rows[rows.length - 1] },
  ] : [];

  const fieldLabels = inputMode === 'speed'
    ? ['Slow end (km/h)', 'Fast end (km/h)']
    : ['Slow end pace (MM:SS/km)', 'Fast end pace (MM:SS/km)'];

  const fieldPlaceholders = inputMode === 'speed' ? ['10.0', '12.0'] : ['6:00', '5:00'];

  function helperLabel(val, speedVal) {
    if (!speedVal) return null;
    if (inputMode === 'speed') return `${formatPace(speedToPace(speedVal))}/km`;
    return `${speedVal.toFixed(1)} km/h`;
  }

  const showError = minValue && maxValue && (
    minSpeed == null || maxSpeed == null
      ? 'Invalid input — check format'
      : !valid && minSpeed != null && maxSpeed != null
        ? inputMode === 'pace'
          ? 'Slow end pace must be slower (higher MM:SS) than fast end'
          : 'Slow end must be less than fast end'
        : null
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Inputs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold tracking-widest text-neutral-500 uppercase">
            Outdoor Speed Range
          </h2>
          <div className="flex gap-1">
            {['speed', 'pace'].map((mode) => (
              <button
                key={mode}
                onClick={() => switchMode(mode)}
                className={`text-xs px-3 py-1 rounded font-bold uppercase tracking-widest transition-colors ${
                  inputMode === mode
                    ? 'bg-[#F27E00] text-black'
                    : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {mode === 'speed' ? 'km/h' : 'min/km'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[[minValue, setMinValue, minSpeed], [maxValue, setMaxValue, maxSpeed]].map(
            ([val, setVal, speedVal], i) => (
              <div key={i} className="space-y-1">
                <label className="text-xs text-neutral-500 uppercase tracking-widest">
                  {fieldLabels[i]}
                </label>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  placeholder={fieldPlaceholders[i]}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 font-pace text-neutral-100 focus:outline-none focus:border-[#F27E00]"
                />
                {helperLabel(val, speedVal) && (
                  <p className="text-xs text-neutral-500 font-pace">
                    {helperLabel(val, speedVal)}
                  </p>
                )}
              </div>
            )
          )}
        </div>

        {showError && (
          <p className="text-xs text-red-400">{showError}</p>
        )}
      </div>

      {/* Summary cards */}
      {valid && rows.length > 0 && (
        <>
          <div className="space-y-3">
            <h2 className="text-xs font-bold tracking-widest text-neutral-500 uppercase">
              Treadmill Equivalents
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {summaryItems.map(({ label, row }) =>
                row ? (
                  <div
                    key={label}
                    className={`rounded-lg p-4 space-y-3 ${
                      label === 'Average'
                        ? 'bg-neutral-800 border border-[#F27E00]'
                        : 'bg-neutral-900 border border-neutral-800'
                    }`}
                  >
                    <div
                      className={`text-xs font-bold tracking-widest uppercase ${
                        label === 'Average' ? 'text-[#F27E00]' : 'text-neutral-500'
                      }`}
                    >
                      {label}
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="space-y-0.5 flex-1">
                        <div className="text-xs text-neutral-500">Outdoor</div>
                        <div className="font-pace text-neutral-100 text-sm">
                          {row.outdoorSpeed.toFixed(1)} km/h
                        </div>
                        <div className="font-pace text-neutral-500 text-xs">
                          {formatPace(row.outdoorPace)}/km
                        </div>
                      </div>
                      <div className="text-neutral-600 pt-4">→</div>
                      <div className="space-y-0.5 flex-1">
                        <div className="text-xs text-neutral-500">Treadmill</div>
                        <div
                          className={`font-pace font-bold text-sm ${
                            label === 'Average' ? 'text-[#F27E00]' : 'text-neutral-100'
                          }`}
                        >
                          {row.treadmillSpeed.toFixed(1)} km/h
                        </div>
                        <div className="font-pace text-neutral-500 text-xs">
                          {formatPace(row.treadmillPace)}/km
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </div>

          {/* Conversion table */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold tracking-widest text-neutral-500 uppercase">
              Conversion Table
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-neutral-700 text-neutral-500 text-xs tracking-widest uppercase">
                    <th className="text-right py-2 pr-4">Outdoor km/h</th>
                    <th className="text-right py-2 pr-4">Outdoor Pace</th>
                    <th className="text-right py-2 pr-4">Treadmill km/h</th>
                    <th className="text-right py-2">Treadmill Pace</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    const isMid = idx === closestMidIdx;
                    return (
                      <tr
                        key={idx}
                        className={`border-b border-neutral-800 ${isMid ? 'bg-neutral-800' : ''}`}
                      >
                        <td
                          className={`py-2 pr-4 text-right font-pace ${
                            isMid ? 'text-[#F27E00] font-bold' : 'text-neutral-200'
                          }`}
                        >
                          {row.outdoorSpeed.toFixed(1)}
                        </td>
                        <td
                          className={`py-2 pr-4 text-right font-pace ${
                            isMid ? 'text-[#F27E00] font-bold' : 'text-neutral-400'
                          }`}
                        >
                          {formatPace(row.outdoorPace)}/km
                        </td>
                        <td
                          className={`py-2 pr-4 text-right font-pace ${
                            isMid ? 'text-[#F27E00] font-bold' : 'text-neutral-200'
                          }`}
                        >
                          {row.treadmillSpeed.toFixed(1)}
                        </td>
                        <td
                          className={`py-2 text-right font-pace ${
                            isMid ? 'text-[#F27E00] font-bold' : 'text-neutral-400'
                          }`}
                        >
                          {formatPace(row.treadmillPace)}/km
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-neutral-600 pt-1">
              Treadmill speed is ~1.5–4.5% higher than outdoor to match equivalent effort (wind resistance model). Alternatively, set treadmill incline to 1% to equalise effort without changing speed.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
