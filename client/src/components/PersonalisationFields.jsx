import React from 'react';

const inputClass =
  'w-full bg-neutral-900 border border-neutral-700 text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:border-[#F27E00] placeholder-neutral-600';

export default function PersonalisationFields({ courseName, raceDate, onCourseNameChange, onRaceDateChange }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-3">
        <h2 className="text-xs font-bold tracking-widest text-neutral-500 uppercase">Course Name</h2>
        <input
          type="text"
          placeholder="e.g. Dublin Marathon 2026"
          value={courseName}
          onChange={(e) => onCourseNameChange(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="space-y-3">
        <h2 className="text-xs font-bold tracking-widest text-neutral-500 uppercase">Race Date</h2>
        <input
          type="date"
          value={raceDate}
          onChange={(e) => onRaceDateChange(e.target.value)}
          className={`${inputClass} ${!raceDate ? 'text-neutral-600' : ''}`}
        />
      </div>
    </div>
  );
}
