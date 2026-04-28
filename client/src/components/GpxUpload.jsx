import React, { useRef, useState } from 'react';

export default function GpxUpload({ onElevationData, onClear, hasData, summaryData, filename, unit }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function processFile(file) {
    if (!file.name.toLowerCase().endsWith('.gpx')) {
      setError('File must be a .gpx file');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('gpxFile', file);
      const res = await fetch(`/api/gpx?unit=${unit || 'km'}`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        onElevationData(data.segments, data.summary, file.name);
      } else {
        setError(data.error || 'Failed to parse GPX file');
      }
    } catch (_) {
      setError('Network error — could not upload file');
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleChange(e) {
    const file = e.target.files[0];
    if (file) processFile(file);
    e.target.value = '';
  }

  function handleClear() {
    setError(null);
    onClear();
  }

  return (
    <div className="space-y-2">
      {!hasData ? (
        <div
          className={`border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors ${
            dragging
              ? 'border-[#F27E00] bg-neutral-900'
              : 'border-neutral-700 hover:border-neutral-500'
          } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <div className="text-2xl mb-2 text-neutral-600">⬆</div>
          <div className="text-sm text-neutral-400">
            {loading ? 'Parsing GPX…' : 'Upload GPX file from Strava, Garmin, Coros…'}
          </div>
          <div className="text-xs text-neutral-600 mt-1">.gpx files only · max 10 MB</div>
          <input
            ref={inputRef}
            type="file"
            accept=".gpx"
            className="hidden"
            onChange={handleChange}
          />
        </div>
      ) : (
        <div className="flex items-center justify-between border border-neutral-700 bg-neutral-900 px-4 py-3">
          <div className="text-sm">
            <span className="text-[#F27E00] font-bold mr-2">✓</span>
            <span className="text-neutral-300">{filename}</span>
            {summaryData && (
              <span className="text-neutral-500 ml-2">
                — {summaryData.totalDistanceKm}km · +{summaryData.totalAscent}m / -{summaryData.totalDescent}m
              </span>
            )}
          </div>
          <button
            onClick={handleClear}
            className="text-xs text-neutral-500 hover:text-red-400 transition-colors ml-4 shrink-0"
          >
            Clear GPX
          </button>
        </div>
      )}
      {error && <div className="text-sm text-red-400 px-1">{error}</div>}
    </div>
  );
}
