import React from 'react';
import { downloadCsv } from '../utils/exportCsv';
import { downloadPdf } from '../utils/exportPdf';

export default function ExportButtons({ segments, raceInfo, elevationSummary, chartRef, courseName, raceDate }) {
  if (!segments || segments.length === 0) return null;

  const enrichedRaceInfo = { ...raceInfo, courseName: courseName || '', raceDate: raceDate || '' };

  function handleCsv() {
    downloadCsv(segments, enrichedRaceInfo, elevationSummary);
  }

  function handlePdf() {
    const chartImage = chartRef?.current?.getChartImage?.() ?? null;
    downloadPdf(segments, enrichedRaceInfo, elevationSummary, chartImage);
  }

  const btn =
    'flex items-center gap-2 border border-[#F27E00] text-[#F27E00] px-4 py-2 text-xs font-bold tracking-widest uppercase transition-colors hover:bg-[#F27E00] hover:text-[#0f0f0f]';

  return (
    <div className="flex gap-3 pt-2">
      <button className={btn} onClick={handleCsv}>
        ⬇ Export CSV
      </button>
      <button className={btn} onClick={handlePdf}>
        ⬇ Export PDF
      </button>
    </div>
  );
}
