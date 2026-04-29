# Race Pace Splitter — Build Handover

**Date:** 2026-04-29  
**Status:** Complete and running  
**Container:** `race-pace-splitter:latest`  
**Live at:** `http://localhost:1337`

---

## What Was Built

A single-container Docker application for race pace planning. Athletes input a race distance and goal time, choose a split strategy, and get a full per-segment pace/time breakdown. V2 adds GPX upload with elevation-aware grade-adjusted pacing and CSV/PDF export.

### Stack
- **Frontend:** React 18 + Vite 5 + Tailwind CSS 3 + Recharts 2 + jsPDF 2
- **Backend:** Node 20 + Express 4 + multer + fast-xml-parser
- **Container:** Multi-stage Docker build (Node 20 Alpine throughout)
- **No component library** — all UI is hand-rolled with Tailwind

---

## Project Structure

```
race-pace-splitter/
├── Dockerfile
├── docker-compose.yml
├── server/
│   ├── index.js          # Express server + /api/gpx endpoint
│   └── package.json      # express, multer, fast-xml-parser
└── client/
    ├── index.html
    ├── package.json      # react, recharts, jspdf, jspdf-autotable
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx               # All state lives here
        ├── index.css             # Tailwind directives + .font-pace utility
        ├── utils/
        │   ├── paceCalc.js       # Core pace/time calculation (pure functions)
        │   ├── gradeAdjust.js    # Grade-adjusted pace with normalisation
        │   ├── exportCsv.js      # CSV Blob download
        │   └── exportPdf.js      # jsPDF A4 PDF generation
        └── components/
            ├── RaceSelector.jsx
            ├── GoalTimeInput.jsx
            ├── SplitModeSelector.jsx
            ├── SplitSlider.jsx
            ├── CustomPaceTable.jsx
            ├── PaceToolbar.jsx         # Pace staging toolbar (Apply to All + ±5s); rendered inside CustomPaceTable
            ├── SplitResultsTable.jsx
            ├── GoalSummary.jsx
            ├── GpxUpload.jsx           # Drag-and-drop GPX upload
            ├── ElevationChart.jsx      # Recharts area chart; exposes getChartImage() ref
            ├── ExportButtons.jsx       # Export CSV / Export PDF
            └── PersonalisationFields.jsx # Optional Course Name + Race Date inputs
```

---

## Docker Setup

**Multi-stage build:**
- Stage 1 (`builder`): installs client deps, runs `vite build`, outputs to `/app/client/dist`
- Stage 2 (runtime): installs only server prod deps, copies `dist` from builder, runs Express

**Port mapping:** host `1337` → container `3000`. The Express server always listens on 3000 internally.

**To bring up:**
```bash
docker compose up
# or directly:
docker run -d -p 1337:3000 race-pace-splitter
```

**To rebuild after changes:**
```bash
docker build -t race-pace-splitter . && docker compose up -d
```

---

## Features Implemented

### V1 Features

| Feature | Component | Notes |
|---|---|---|
| Race distance selector | `RaceSelector.jsx` | 4 presets + custom field with km/mi toggle and live unit conversion |
| Goal time input | `GoalTimeInput.jsx` | H/M/S fields; shows avg pace per km and per mile once both inputs are set |
| Split mode tabs | `SplitModeSelector.jsx` | Even / Negative / Positive / Custom |
| Split differential slider | `SplitSlider.jsx` | 1–15%, visible only in Positive/Negative modes; shows projected time + delta vs goal in real time |
| Results table | `SplitResultsTable.jsx` | Seg, distance marker, pace, cumulative time; highlights segments deviating >10s from avg pace in yellow |
| Custom pace table | `CustomPaceTable.jsx` | One editable MM:SS row per segment; validates format; shows cumulative time and total delta |
| Goal summary bar | `GoalSummary.jsx` | Persistent bar across all modes once race + goal time are set |

### V2 Features

| Feature | Files | Notes |
|---|---|---|
| GPX file upload | `server/index.js`, `GpxUpload.jsx` | Server parses GPX XML with fast-xml-parser; extracts trackpoints, computes haversine distances, returns per-segment elevation data |
| Grade-adjusted pace | `gradeAdjust.js`, `SplitResultsTable.jsx`, `CustomPaceTable.jsx` | Multiplier formula applied per segment; paces normalised so total = goal time exactly |
| Elevation chart | `ElevationChart.jsx` | Recharts AreaChart with orange gradient; segment ReferenceLine boundaries; exposes `getChartImage()` via forwardRef for PDF capture |
| CSV export | `exportCsv.js`, `ExportButtons.jsx` | Comment-header rows + column header + data rows; elevation columns included when GPX loaded; goalTime row omitted from header if not set |
| PDF export | `exportPdf.js`, `ExportButtons.jsx` | jsPDF A4 light theme; info grid header, embedded elevation chart image, jspdf-autotable splits table with orange header row; Goal Time and Avg Pace rows omitted from info grid if not set |
| GoalSummary elevation | `GoalSummary.jsx` | Shows total ascent and descent when GPX is loaded |

### V3 Features

| Feature | Files | Notes |
|---|---|---|
| Course Name input | `PersonalisationFields.jsx`, `App.jsx` | Optional free-text field; appears in GoalSummary, PDF title, CSV header, and export filename |
| Race Date input | `PersonalisationFields.jsx`, `App.jsx` | Optional date picker; displayed as locale-formatted string everywhere (e.g. "26 October 2026"); PDF includes weekday |

### V4 Features

| Feature | Files | Notes |
|---|---|---|
| Pace toolbar (Custom mode) | `PaceToolbar.jsx`, `CustomPaceTable.jsx` | Toolbar rendered above the custom pace table; only visible in Custom split mode |

**PaceToolbar details:**
- Contains a MM:SS pace input field (same validation + styling as per-segment inputs), with the unit label (`/km` or `/mi`) shown inline
- **−5 / +5 buttons** adjust the staged input value by ±5 seconds with correct MM:SS rollover (e.g. 5:00 − 5s → 4:55; 4:57 + 5s → 5:02). Minimum floor is 5 seconds. If the field contains an invalid value when a nudge button is pressed, defaults to 5:00 before adjusting.
- **Apply to All** button fills every segment row with the staged pace value, triggering immediate recalculation of cumulative times, total time, and goal delta via the existing `onChange` handler passed from App.jsx
- Toolbar state (the staged input value) is local to `PaceToolbar` — it does not lift to App.jsx. Only the `onChange(allPaces)` call on Apply writes to shared state.

---

## Calculation Logic

### paceCalc.js (unchanged from V1)

All pure functions, no side effects:

- `generateEvenSplits(distanceKm, goalSeconds, unit)` — identical pace every segment
- `generateProgressiveSplits(distanceKm, goalSeconds, unit, splitPercent, direction)` — linear pace gradient; total always equals `goalSeconds` exactly
- `calcCumulativeTime(segments)` — adds `cumulativeSeconds` to each segment
- `formatPace(secondsPerKm)` → `"MM:SS"`
- `formatTime(totalSeconds)` → `"H:MM:SS"`
- `parsePaceInput(mmss)` → seconds or `null` if invalid

Segment objects: `{ segment, distanceMarker, paceSeconds, segmentLengthKm, cumulativeSeconds }`

### gradeAdjust.js (V2)

`applyGradeAdjustment(segments, elevationProfile, goalSeconds)`:

1. For each segment, read `gradientPercent` from the elevation profile
2. Compute effort multiplier:
   - Uphill (≥ 0%): `1 + 0.033 × gradient`
   - Mild downhill (0% to −10%): `1 − 0.018 × |gradient|`
   - Steep downhill (< −10%): `0.82 + 0.02 × (|gradient| − 10)` — benefit caps, cost resumes
3. Apply multiplier to each segment's `paceSeconds` → raw `adjustedPaceSeconds`
4. Scale all adjusted paces by `goalSeconds / rawTotal` so sum of segment times = goal exactly
5. Returns segments with added fields: `flatPaceSeconds`, `adjustedPaceSeconds`, `elevationGain`, `elevationLoss`, `netChange`, `gradientPercent`

### GPX Parsing (server/index.js — V2)

1. multer receives the file into memory (max 10 MB)
2. fast-xml-parser parses the XML; supports `<trk>/<trkseg>/<trkpt>` and falls back to `<rte>/<rtept>`
3. Cumulative haversine distance computed across all trackpoints
4. Trackpoints bucketed into 1km (or 1mi) segments
5. Per segment: `startElevation`, `endElevation`, `elevationGain`, `elevationLoss`, `netChange`, `gradientPercent`

---

## App State (App.jsx)

```
selectedRace       — { label, distanceKm, unit } | null
goalTime           — { h, m, s }
splitMode          — 'even' | 'positive' | 'negative' | 'custom'
splitPercent       — number (1–15)
customPaces        — string[] (MM:SS per segment)
elevationProfile   — server segment array | null
elevationSummary   — { totalDistanceKm, totalAscent, totalDescent, pointCount } | null
gpxFilename        — string | null
courseName         — string (default "")
raceDate           — string ISO "YYYY-MM-DD" (default "")

Derived:
goalSeconds        — useMemo from goalTime
segments           — base pace segments (non-custom modes)
adjustedSegments   — segments with grade adjustment applied
customSegments     — computed from customPaces (for export + GoalSummary)
exportSegments     — adjustedSegments or customSegments depending on mode
raceInfo           — { raceName, distanceKm, unit, goalTime, splitMode, splitPercent, avgPace }
                     In custom mode, raceInfo is non-null even when goalSeconds is null (goalTime
                     and avgPace fields will be null in that case).

Note: courseName and raceDate are passed separately alongside raceInfo to GoalSummary and ExportButtons. ExportButtons merges them into raceInfo before calling export utilities (as courseName and raceDate keys), keeping raceInfo minimal for the non-export use cases.
```

### Export Button Visibility Rule

| Split mode | Condition to show Export buttons |
|---|---|
| `custom` | `exportSegments.length > 0` (all segment paces filled in); goal time is **not** required |
| `even`, `positive`, `negative` | `raceInfo != null && exportSegments.length > 0` (requires both selected race and goal time) |

This is enforced by the `{raceInfo && exportSegments.length > 0 && (` condition in `App.jsx`, combined with `raceInfo` being non-null in custom mode as long as a race is selected.

---

## Verified Endpoints

| Method | Path | Response | Notes |
|---|---|---|---|
| `GET /` | SPA | 200 | Serves `index.html` with bundled React app |
| `GET /*` | SPA catch-all | 200 | Client-side routing support |
| `POST /api/gpx` | JSON | 200 | Real GPX parsing endpoint; returns `{ success, summary, segments }` |

---

## Issues Encountered and Fixes

### 1. Port conflict (V1)
**Problem:** Original spec used port 3000, which was already occupied on the host machine.  
**Fix:** Changed `docker-compose.yml` host mapping from `3000:3000` to `1337:3000`.

### 2. No local Node/npm (V1)
**Problem:** Host machine has no Node or npm installed.  
**Fix:** Docker build itself serves as the validation step.

### 3. PostCSS config module type warning (V1, ongoing)
**Problem:** `postcss.config.js` uses ESM syntax but `client/package.json` has no `"type": "module"`.  
**Impact:** Warning only — build and CSS output are correct.  
**Fix (if desired):** Add `"type": "module"` to `client/package.json`.

### 4. gpxparser incompatible with Node.js (V2)
**Problem:** The `gpxparser` npm package uses `DOMParser` internally, which is not available in Node 20 without a polyfill.  
**Fix:** Used `fast-xml-parser` instead — pure Node.js XML parser, no DOM dependency. GPX trackpoints are extracted directly from the parsed object tree.

### 5. docker-compose image name mismatch (V2)
**Problem:** `docker compose up` rebuilds as `race-pace-splitter-app` (prefixed with project name), while `docker build -t race-pace-splitter` produces a differently named image. The compose-built image had no port binding in one run.  
**Fix:** Use `docker build -t race-pace-splitter . && docker run -d -p 1337:3000 race-pace-splitter` for reliable manual runs, or trust `docker compose up` to wire ports correctly when run from the project directory.

---

## What Is Not Implemented

- Persistence / saving of plans
- Authentication
- Any backend calculation beyond GPX parsing — all pace math runs client-side

---

## Next Steps / Known Opportunities

- Add `"type": "module"` to `client/package.json` to clear the PostCSS build warning
- Add a `.dockerignore` to exclude `node_modules`, `.git`, etc. for faster rebuilds
- Consider a `healthcheck` in `docker-compose.yml` for production use
- Code-split the bundle — jsPDF + recharts push the main chunk to ~950 kB minified; dynamic `import()` for the export utilities would fix the Vite chunk size warning
- Save and share plans via URL (encode state in query string or short link)
